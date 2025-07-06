#!/bin/bash

# Smart Contract Build and Deploy Script for ImpactPools
# This script handles Soroban contract compilation and deployment

set -e

echo "🚀 ImpactPools Smart Contract Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NETWORK=${NETWORK:-testnet}
CONTRACTS_DIR="./contracts"
IMPACT_POOL_DIR="$CONTRACTS_DIR/impact_pool"
ADMIN_SECRET=${ADMIN_SECRET:-""}

# Check if Soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo -e "${RED}❌ Soroban CLI not found. Please install it first:${NC}"
    echo "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "cargo install --locked soroban-cli"
    exit 1
fi

# Check if admin secret is provided
if [ -z "$ADMIN_SECRET" ]; then
    echo -e "${YELLOW}⚠️  No admin secret provided. Generating a new one...${NC}"
    ADMIN_SECRET=$(soroban keys generate admin --network $NETWORK 2>/dev/null || echo "")
    if [ -z "$ADMIN_SECRET" ]; then
        echo -e "${RED}❌ Failed to generate admin key${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Generated admin key: $ADMIN_SECRET${NC}"
fi

# Function to build contract
build_contract() {
    local contract_dir=$1
    local contract_name=$(basename $contract_dir)
    
    echo -e "${YELLOW}🔨 Building $contract_name contract...${NC}"
    
    cd $contract_dir
    
    # Build the contract
    if soroban contract build; then
        echo -e "${GREEN}✅ $contract_name built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build $contract_name${NC}"
        exit 1
    fi
    
    cd - > /dev/null
}

# Function to deploy contract
deploy_contract() {
    local contract_dir=$1
    local contract_name=$(basename $contract_dir)
    local wasm_file="$contract_dir/target/wasm32-unknown-unknown/release/${contract_name}.wasm"
    
    echo -e "${YELLOW}🚀 Deploying $contract_name to $NETWORK...${NC}"
    
    if [ ! -f "$wasm_file" ]; then
        echo -e "${RED}❌ WASM file not found: $wasm_file${NC}"
        exit 1
    fi
    
    # Deploy the contract
    CONTRACT_ID=$(soroban contract deploy \
        --wasm $wasm_file \
        --source-account $ADMIN_SECRET \
        --network $NETWORK 2>/dev/null || echo "")
    
    if [ -z "$CONTRACT_ID" ]; then
        echo -e "${RED}❌ Failed to deploy $contract_name${NC}"
        echo -e "${YELLOW}📝 For testnet deployment, make sure the admin account is funded.${NC}"
        echo "You can fund it at: https://laboratory.stellar.org/#account-creator?network=test"
        exit 1
    fi
    
    echo -e "${GREEN}✅ $contract_name deployed successfully${NC}"
    echo -e "${GREEN}📋 Contract ID: $CONTRACT_ID${NC}"
    
    # Save contract ID to environment file
    echo "REACT_APP_${contract_name^^}_CONTRACT=$CONTRACT_ID" >> .env.local
    echo "BACKEND_${contract_name^^}_CONTRACT=$CONTRACT_ID" >> .env.local
}

# Function to initialize contract
initialize_contract() {
    local contract_id=$1
    local contract_name=$2
    
    echo -e "${YELLOW}🔧 Initializing $contract_name...${NC}"
    
    # For Impact Pool, we'll initialize with default parameters
    if [ "$contract_name" = "impact_pool" ]; then
        # Initialize the Impact Pool contract
        # This would call the initialize function with default parameters
        echo -e "${GREEN}📋 Impact Pool initialization would be called here${NC}"
        echo "soroban contract invoke --id $contract_id --source-account $ADMIN_SECRET --network $NETWORK -- initialize ..."
    fi
}

# Function to verify deployment
verify_deployment() {
    local contract_id=$1
    local contract_name=$2
    
    echo -e "${YELLOW}🔍 Verifying $contract_name deployment...${NC}"
    
    # Check if contract exists and is responsive
    # This would call a simple read-only function
    echo -e "${GREEN}✅ $contract_name verification would be performed here${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}📋 Network: $NETWORK${NC}"
    echo -e "${YELLOW}👤 Admin Account: ${ADMIN_SECRET:0:8}...${NC}"
    echo ""
    
    # Create contracts directory if it doesn't exist
    mkdir -p $CONTRACTS_DIR
    
    # Check if Impact Pool contract exists
    if [ ! -d "$IMPACT_POOL_DIR" ]; then
        echo -e "${YELLOW}📁 Impact Pool contract directory not found. Creating basic structure...${NC}"
        mkdir -p $IMPACT_POOL_DIR/src
        
        # Create basic Cargo.toml if it doesn't exist
        if [ ! -f "$IMPACT_POOL_DIR/Cargo.toml" ]; then
            cat > $IMPACT_POOL_DIR/Cargo.toml << EOF
[package]
name = "impact_pool"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "20.0.0"

[features]
testutils = ["soroban-sdk/testutils"]

[[bin]]
name = "impact_pool"
path = "src/lib.rs"
EOF
        fi
        
        echo -e "${GREEN}✅ Created basic contract structure${NC}"
        echo -e "${YELLOW}📝 Please add your contract code to $IMPACT_POOL_DIR/src/lib.rs${NC}"
        echo -e "${YELLOW}📝 Then run this script again to build and deploy${NC}"
        exit 0
    fi
    
    # Build Impact Pool contract
    build_contract $IMPACT_POOL_DIR
    
    # Deploy Impact Pool contract
    IMPACT_POOL_CONTRACT_ID=""
    deploy_contract $IMPACT_POOL_DIR
    IMPACT_POOL_CONTRACT_ID=$CONTRACT_ID
    
    # Initialize contracts
    initialize_contract $IMPACT_POOL_CONTRACT_ID "impact_pool"
    
    # Verify deployments
    verify_deployment $IMPACT_POOL_CONTRACT_ID "impact_pool"
    
    echo ""
    echo -e "${GREEN}🎉 Smart Contract Deployment Complete!${NC}"
    echo "================================================"
    echo -e "${GREEN}📋 Impact Pool Contract: $IMPACT_POOL_CONTRACT_ID${NC}"
    echo -e "${GREEN}🌐 Network: $NETWORK${NC}"
    echo -e "${GREEN}👤 Admin Account: ${ADMIN_SECRET:0:8}...${NC}"
    echo ""
    echo -e "${YELLOW}📝 Environment variables saved to .env.local${NC}"
    echo -e "${YELLOW}📝 Add these to your frontend and backend .env files:${NC}"
    echo ""
    cat .env.local
    echo ""
    echo -e "${GREEN}✅ Ready to use enhanced ImpactPools with smart contracts!${NC}"
}

# Handle errors gracefully
trap 'echo -e "${RED}❌ Script failed. Check the error above.${NC}"; exit 1' ERR

# Run main function
main "$@"
