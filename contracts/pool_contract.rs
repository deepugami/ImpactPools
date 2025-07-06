//! ImpactPool Smart Contract
//! A Soroban smart contract for managing pool deposits, withdrawals, and yield distribution

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Symbol, Vec, Map, token
};

#[derive(Clone)]
#[contracttype]
pub struct PoolInfo {
    pub name: Symbol,
    pub charity: Address,
    pub donation_percentage: u32, // Percentage (0-100)
    pub creator: Address,
    pub total_deposited: i128,
    pub total_yield: i128,
    pub total_donated: i128,
    pub is_active: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct UserPosition {
    pub deposited: i128,
    pub withdrawn: i128,
    pub yield_earned: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    PoolInfo,
    UserPosition(Address),
    TotalUsers,
    YieldRate,
}

const POOL_INFO: Symbol = symbol_short!("POOL");
const YIELD_RATE: Symbol = symbol_short!("YIELD");

#[contract]
pub struct ImpactPoolContract;

#[contractimpl]
impl ImpactPoolContract {
    /// Initialize a new impact pool
    pub fn initialize(
        env: Env,
        name: Symbol,
        charity: Address,
        donation_percentage: u32,
        creator: Address,
        token_address: Address,
    ) {
        // Ensure the pool hasn't been initialized yet
        if env.storage().instance().has(&DataKey::PoolInfo) {
            panic!("Pool already initialized");
        }

        // Validate donation percentage
        if donation_percentage > 100 {
            panic!("Donation percentage cannot exceed 100%");
        }

        let pool_info = PoolInfo {
            name,
            charity,
            donation_percentage,
            creator,
            total_deposited: 0,
            total_yield: 0,
            total_donated: 0,
            is_active: true,
        };

        env.storage().instance().set(&DataKey::PoolInfo, &pool_info);
        env.storage().instance().set(&DataKey::TotalUsers, &0u32);
        env.storage().instance().set(&DataKey::YieldRate, &50i128); // 5% default APY (500 basis points)
    }

    /// Deposit tokens to the pool
    pub fn deposit(env: Env, user: Address, amount: i128, token_address: Address) {
        // Authenticate the user
        user.require_auth();

        if amount <= 0 {
            panic!("Deposit amount must be positive");
        }

        // Get pool info
        let mut pool_info: PoolInfo = env.storage().instance()
            .get(&DataKey::PoolInfo)
            .expect("Pool not initialized");

        if !pool_info.is_active {
            panic!("Pool is not active");
        }

        // Get or create user position
        let mut user_position = env.storage().persistent()
            .get(&DataKey::UserPosition(user.clone()))
            .unwrap_or(UserPosition {
                deposited: 0,
                withdrawn: 0,
                yield_earned: 0,
            });

        // Transfer tokens from user to contract
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Update user position
        user_position.deposited += amount;

        // Update pool info
        pool_info.total_deposited += amount;

        // Save updated data
        env.storage().persistent().set(&DataKey::UserPosition(user), &user_position);
        env.storage().instance().set(&DataKey::PoolInfo, &pool_info);

        // Emit event
        env.events().publish((symbol_short!("DEPOSIT"), user), (amount, pool_info.total_deposited));
    }

    /// Withdraw tokens from the pool
    pub fn withdraw(env: Env, user: Address, amount: i128, token_address: Address) {
        // Authenticate the user
        user.require_auth();

        if amount <= 0 {
            panic!("Withdrawal amount must be positive");
        }

        // Get user position
        let mut user_position: UserPosition = env.storage().persistent()
            .get(&DataKey::UserPosition(user.clone()))
            .expect("User has no deposits");

        let available_balance = user_position.deposited - user_position.withdrawn;
        
        if amount > available_balance {
            panic!("Insufficient balance for withdrawal");
        }

        // Get pool info
        let mut pool_info: PoolInfo = env.storage().instance()
            .get(&DataKey::PoolInfo)
            .expect("Pool not initialized");

        // Transfer tokens from contract to user
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        // Update user position
        user_position.withdrawn += amount;

        // Update pool info
        pool_info.total_deposited -= amount;

        // Save updated data
        env.storage().persistent().set(&DataKey::UserPosition(user.clone()), &user_position);
        env.storage().instance().set(&DataKey::PoolInfo, &pool_info);

        // Emit event
        env.events().publish((symbol_short!("WITHDRAW"), user), (amount, available_balance - amount));
    }

    /// Distribute yield to the pool (admin function)
    pub fn distribute_yield(env: Env, admin: Address, yield_amount: i128, token_address: Address) {
        admin.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance()
            .get(&DataKey::PoolInfo)
            .expect("Pool not initialized");

        // Calculate donation amount
        let donation_amount = (yield_amount * pool_info.donation_percentage as i128) / 100;
        let remaining_yield = yield_amount - donation_amount;

        // Transfer donation to charity
        if donation_amount > 0 {
            let token_client = token::Client::new(&env, &token_address);
            token_client.transfer(&env.current_contract_address(), &pool_info.charity, &donation_amount);
        }

        // Update pool totals
        pool_info.total_yield += remaining_yield;
        pool_info.total_donated += donation_amount;

        env.storage().instance().set(&DataKey::PoolInfo, &pool_info);

        // Emit event
        env.events().publish(
            (symbol_short!("YIELD"), symbol_short!("DISTRIB")), 
            (yield_amount, donation_amount, remaining_yield)
        );
    }

    /// Get user's available balance for withdrawal
    pub fn get_user_balance(env: Env, user: Address) -> i128 {
        let user_position: UserPosition = env.storage().persistent()
            .get(&DataKey::UserPosition(user))
            .unwrap_or(UserPosition {
                deposited: 0,
                withdrawn: 0,
                yield_earned: 0,
            });

        user_position.deposited - user_position.withdrawn + user_position.yield_earned
    }

    /// Get pool information
    pub fn get_pool_info(env: Env) -> PoolInfo {
        env.storage().instance()
            .get(&DataKey::PoolInfo)
            .expect("Pool not initialized")
    }

    /// Get user position details
    pub fn get_user_position(env: Env, user: Address) -> UserPosition {
        env.storage().persistent()
            .get(&DataKey::UserPosition(user))
            .unwrap_or(UserPosition {
                deposited: 0,
                withdrawn: 0,
                yield_earned: 0,
            })
    }

    /// Emergency pause (admin only)
    pub fn pause_pool(env: Env, admin: Address) {
        admin.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance()
            .get(&DataKey::PoolInfo)
            .expect("Pool not initialized");

        // Only creator can pause
        if admin != pool_info.creator {
            panic!("Only pool creator can pause");
        }

        pool_info.is_active = false;
        env.storage().instance().set(&DataKey::PoolInfo, &pool_info);

        env.events().publish((symbol_short!("PAUSE"),), (admin,));
    }

    /// Resume pool (admin only)
    pub fn resume_pool(env: Env, admin: Address) {
        admin.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance()
            .get(&DataKey::PoolInfo)
            .expect("Pool not initialized");

        // Only creator can resume
        if admin != pool_info.creator {
            panic!("Only pool creator can resume");
        }

        pool_info.is_active = true;
        env.storage().instance().set(&DataKey::PoolInfo, &pool_info);

        env.events().publish((symbol_short!("RESUME"),), (admin,));
    }
}
