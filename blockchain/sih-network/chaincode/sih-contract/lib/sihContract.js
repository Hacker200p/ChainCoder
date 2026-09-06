'use strict';

const { Contract } = require('fabric-contract-api');

module.exports = class SIHContract extends Contract {

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    getIdentityKey(identityId) {
        return `IDENTITY_${identityId}`;
    }

    getAssetKey(assetId) {
        return `ASSET_${assetId}`;
    }

    getAccessKey(identityId, assetId) {
        return `ACCESS_${identityId}_${assetId}`;
    }

    async identityExists(ctx, identityId) {
        const key = this.getIdentityKey(identityId);
        const data = await ctx.stub.getState(key);
        return data && data.length > 0;
    }

    async assetExists(ctx, assetId) {
        const key = this.getAssetKey(assetId);
        const data = await ctx.stub.getState(key);
        return data && data.length > 0;
    }

    async accessExists(ctx, identityId, assetId) {
        const key = this.getAccessKey(identityId, assetId);
        const data = await ctx.stub.getState(key);
        return data && data.length > 0;
    }

    requireOrganization(ctx, allowedOrganizations) {
        const mspId = ctx.clientIdentity.getMSPID();

        if (!allowedOrganizations.includes(mspId)) {
            throw new Error(
                `Access denied. Organization ${mspId} is not authorized`
            );
        }

        return mspId;
    }

    // ============================================================
    // TEST
    // ============================================================

    async test(ctx) {
        return JSON.stringify({
            message: 'SIH26125 chaincode is working',
            timestamp: new Date().toISOString()
        });
    }

    // ============================================================
    // IDENTITY MANAGEMENT
    // ============================================================

    async RegisterIdentity(
        ctx,
        identityId,
        name,
        organization,
        role
    ) {

        // Only BEL can register identities
        this.requireOrganization(ctx, ['BELMSP']);

        if (!identityId || !name || !organization || !role) {
            throw new Error(
                'identityId, name, organization and role are required'
            );
        }

        const exists = await this.identityExists(ctx, identityId);

        if (exists) {
            throw new Error(
                `Identity ${identityId} already exists`
            );
        }

        const timestamp = new Date().toISOString();

        const identity = {
            identityId,
            name,
            organization,
            role,
            status: 'ACTIVE',
            createdAt: timestamp,
            updatedAt: timestamp
        };

        const key = this.getIdentityKey(identityId);

        await ctx.stub.putState(
            key,
            Buffer.from(JSON.stringify(identity))
        );

        return JSON.stringify(identity);
    }

    // ============================================================
    // GET IDENTITY
    // ============================================================

    async GetIdentity(ctx, identityId) {

        if (!identityId) {
            throw new Error('identityId is required');
        }

        const key = this.getIdentityKey(identityId);

        const data = await ctx.stub.getState(key);

        if (!data || data.length === 0) {
            throw new Error(
                `Identity ${identityId} does not exist`
            );
        }

        return data.toString();
    }

    // ============================================================
    // REVOKE IDENTITY
    // ============================================================

    async RevokeIdentity(ctx, identityId) {

        this.requireOrganization(
            ctx,
            ['BELMSP', 'AuditorMSP']
        );

        if (!identityId) {
            throw new Error('identityId is required');
        }

        const key = this.getIdentityKey(identityId);

        const data = await ctx.stub.getState(key);

        if (!data || data.length === 0) {
            throw new Error(
                `Identity ${identityId} does not exist`
            );
        }

        const identity = JSON.parse(data.toString());

        if (identity.status === 'REVOKED') {
            throw new Error(
                `Identity ${identityId} is already revoked`
            );
        }

        identity.status = 'REVOKED';
        identity.updatedAt = new Date().toISOString();

        await ctx.stub.putState(
            key,
            Buffer.from(JSON.stringify(identity))
        );

        return JSON.stringify(identity);
    }

    // ============================================================
    // ACCESS CONTROL
    // ============================================================

    // ------------------------------------------------------------
    // GRANT ACCESS
    // ------------------------------------------------------------

    async GrantAccess(
        ctx,
        accessId,
        identityId,
        assetId,
        grantedTo,
        permission
    ) {

        const grantingMSP = this.requireOrganization(
            ctx,
            ['BELMSP', 'AuditorMSP']
        );

        if (
            !accessId ||
            !identityId ||
            !assetId ||
            !grantedTo ||
            !permission
        ) {
            throw new Error(
                'accessId, identityId, assetId, grantedTo and permission are required'
            );
        }

        // Check identity
        const identityExists = await this.identityExists(
            ctx,
            identityId
        );

        if (!identityExists) {
            throw new Error(
                `Identity ${identityId} does not exist`
            );
        }

        // Check asset
        const assetExists = await this.assetExists(
            ctx,
            assetId
        );

        if (!assetExists) {
            throw new Error(
                `Asset ${assetId} does not exist`
            );
        }

        // Access is uniquely identified by identity + asset
        const key = this.getAccessKey(
            identityId,
            assetId
        );

        const existing = await ctx.stub.getState(key);

        if (existing && existing.length > 0) {
            throw new Error(
                `Access already exists for identity ${identityId} and asset ${assetId}`
            );
        }

        const timestamp = new Date().toISOString();

        const access = {
            accessId,
            identityId,
            assetId,
            grantedBy: grantingMSP,
            grantedTo,
            permission,
            status: 'ACTIVE',
            createdAt: timestamp,
            updatedAt: timestamp
        };

        await ctx.stub.putState(
            key,
            Buffer.from(JSON.stringify(access))
        );

        return JSON.stringify(access);
    }

    // ------------------------------------------------------------
    // CHECK ACCESS
    // ------------------------------------------------------------

    async CheckAccess(
        ctx,
        identityId,
        assetId
    ) {

        if (!identityId || !assetId) {
            throw new Error(
                'identityId and assetId are required'
            );
        }

        const key = this.getAccessKey(
            identityId,
            assetId
        );

        const data = await ctx.stub.getState(key);

        if (!data || data.length === 0) {
            return JSON.stringify({
                identityId,
                assetId,
                hasAccess: false
            });
        }

        const access = JSON.parse(data.toString());

        if (access.status !== 'ACTIVE') {
            return JSON.stringify({
                identityId,
                assetId,
                hasAccess: false
            });
        }

        return JSON.stringify({
            identityId,
            assetId,
            hasAccess: true,
            permission: access.permission,
            accessId: access.accessId
        });
    }

    // ------------------------------------------------------------
    // REVOKE ACCESS
    // ------------------------------------------------------------

    async RevokeAccess(
        ctx,
        identityId,
        assetId
    ) {

        const callerMSP = ctx.clientIdentity.getMSPID();

        if (!callerMSP) {
            throw new Error(
                'Unable to determine caller organization'
            );
        }

        const key = this.getAccessKey(
            identityId,
            assetId
        );

        const data = await ctx.stub.getState(key);

        if (!data || data.length === 0) {
            throw new Error(
                `Access for identity ${identityId} and asset ${assetId} does not exist`
            );
        }

        const access = JSON.parse(data.toString());

        if (access.grantedBy !== callerMSP) {
            throw new Error(
                `Only ${access.grantedBy} can revoke this access`
            );
        }

        if (access.status === 'REVOKED') {
            throw new Error(
                `Access for identity ${identityId} and asset ${assetId} is already revoked`
            );
        }

        access.status = 'REVOKED';
        access.updatedAt = new Date().toISOString();

        await ctx.stub.putState(
            key,
            Buffer.from(JSON.stringify(access))
        );

        return JSON.stringify(access);
    }

    // ============================================================
    // ASSET MANAGEMENT
    // ============================================================

    // ------------------------------------------------------------
    // MINT ASSET
    // ------------------------------------------------------------

    async MintAsset(
        ctx,
        assetId,
        name,
        assetType,
        owner,
        documentHash,
        documentCID
    ) {

        this.requireOrganization(
            ctx,
            ['BELMSP', 'AuditorMSP']
        );

        if (
            !assetId ||
            !name ||
            !assetType ||
            !owner
        ) {
            throw new Error(
                'assetId, name, assetType and owner are required'
            );
        }

        // Owner must be a registered identity
        const ownerExists = await this.identityExists(
            ctx,
            owner
        );

        if (!ownerExists) {
            throw new Error(
                `Owner identity ${owner} does not exist`
            );
        }

        const key = this.getAssetKey(assetId);

        const existing = await ctx.stub.getState(key);

        if (existing && existing.length > 0) {
            throw new Error(
                `Asset ${assetId} already exists`
            );
        }

        const timestamp = new Date().toISOString();

        const asset = {
            assetId,
            name,
            assetType,
            owner,
            status: 'ACTIVE',
            documentHash: documentHash || '',
            documentCID: documentCID || '',
            createdAt: timestamp,
            updatedAt: timestamp
        };

        await ctx.stub.putState(
            key,
            Buffer.from(JSON.stringify(asset))
        );

        return JSON.stringify(asset);
    }

    // ------------------------------------------------------------
    // GET ASSET
    // ------------------------------------------------------------

    async GetAsset(ctx, assetId) {

        if (!assetId) {
            throw new Error('assetId is required');
        }

        const key = this.getAssetKey(assetId);

        const data = await ctx.stub.getState(key);

        if (!data || data.length === 0) {
            throw new Error(
                `Asset ${assetId} does not exist`
            );
        }

        return data.toString();
    }

    // ------------------------------------------------------------
    // TRANSFER ASSET
    // ------------------------------------------------------------

    async TransferAsset(
        ctx,
        assetId,
        newOwner
    ) {

        if (!assetId || !newOwner) {
            throw new Error(
                'assetId and newOwner are required'
            );
        }

        // New owner must exist
        const newOwnerExists = await this.identityExists(
            ctx,
            newOwner
        );

        if (!newOwnerExists) {
            throw new Error(
                `New owner identity ${newOwner} does not exist`
            );
        }

        const key = this.getAssetKey(assetId);

        const data = await ctx.stub.getState(key);

        if (!data || data.length === 0) {
            throw new Error(
                `Asset ${assetId} does not exist`
            );
        }

        const asset = JSON.parse(data.toString());

        if (asset.status !== 'ACTIVE') {
            throw new Error(
                `Asset ${assetId} is not active`
            );
        }

        /*
         * Temporary ownership model:
         * The backend will provide the registered identityId
         * associated with the Fabric caller.
         *
         * Full Fabric certificate ↔ identity mapping will be
         * added during authentication/RBAC implementation.
         */

        const callerMSP = ctx.clientIdentity.getMSPID();

        if (!callerMSP) {
            throw new Error(
                'Unable to determine caller organization'
            );
        }

        // For now, only the owner's organization may initiate
        // the transfer. Detailed identity verification comes
        // with the authentication/RBAC layer.
        const ownerData = await ctx.stub.getState(
            this.getIdentityKey(asset.owner)
        );

        if (!ownerData || ownerData.length === 0) {
            throw new Error(
                `Owner identity ${asset.owner} does not exist`
            );
        }

        const owner = JSON.parse(ownerData.toString());

        if (owner.organization === 'BEL' && callerMSP !== 'BELMSP') {
            throw new Error(
                'Only BEL can transfer this asset'
            );
        }

        if (
            owner.organization === 'Auditor' &&
            callerMSP !== 'AuditorMSP'
        ) {
            throw new Error(
                'Only Auditor can transfer this asset'
            );
        }

        if (
            owner.organization === 'Contractor' &&
            callerMSP !== 'ContractorMSP'
        ) {
            throw new Error(
                'Only the asset owner organization can transfer this asset'
            );
        }

        asset.owner = newOwner;
        asset.updatedAt = new Date().toISOString();

        await ctx.stub.putState(
            key,
            Buffer.from(JSON.stringify(asset))
        );

        return JSON.stringify(asset);
    }
}