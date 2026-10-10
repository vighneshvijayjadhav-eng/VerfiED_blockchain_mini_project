// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertificateRegistry {
    error Unauthorized();
    error InvalidCredential();
    error AlreadyExists();
    error NotFound();
    error AlreadyRevoked();
    struct Certificate { bytes32 dataHash; address issuer; uint256 issuedAt; bool revoked; }
    address public immutable authorizedIssuer;
    mapping(bytes32 => Certificate) private certificates;
    event CertificateIssued(bytes32 indexed id, bytes32 dataHash, address indexed issuer, uint256 issuedAt);
    event CertificateRevoked(bytes32 indexed id, address indexed issuer, uint256 revokedAt);

    constructor() { authorizedIssuer = msg.sender; }
    modifier onlyIssuer() { if (msg.sender != authorizedIssuer) revert Unauthorized(); _; }
    function issueCertificate(bytes32 id, bytes32 dataHash) external onlyIssuer {
        if (id == bytes32(0) || dataHash == bytes32(0)) revert InvalidCredential();
        if (certificates[id].issuer != address(0)) revert AlreadyExists();
        certificates[id] = Certificate(dataHash, msg.sender, block.timestamp, false);
        emit CertificateIssued(id, dataHash, msg.sender, block.timestamp);
    }
    function getCertificate(bytes32 id) external view returns (Certificate memory) {
        if (certificates[id].issuer == address(0)) revert NotFound();
        return certificates[id];
    }
    function revokeCertificate(bytes32 id) external onlyIssuer {
        if (certificates[id].issuer == address(0)) revert NotFound();
        if (certificates[id].revoked) revert AlreadyRevoked();
        certificates[id].revoked = true;
        emit CertificateRevoked(id, msg.sender, block.timestamp);
    }
}
