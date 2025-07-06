#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Map, Symbol, Vec, token
};

#[derive(Clone)]
#[contracttype]
pub struct PoolInfo {
    pub name: Symbol,
    pub charity: Symbol,
    pub donation_percentage: u32,
    pub creator: Address,
    pub total_deposited: i128,
    pub total_donated: i128,
    pub asset: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct UserDeposit {
    pub user: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contract]
pub struct ImpactPoolContract;

const POOL_INFO: Symbol = symbol_short!("POOL_INFO");
const USER_DEPOSITS: Symbol = symbol_short!("DEPOSITS");
const TOTAL_DEPOSITED: Symbol = symbol_short!("TOTAL");

#[contractimpl]
impl ImpactPoolContract {
    /// Initialize the impact pool
    pub fn initialize(
        env: Env,
        name: Symbol,
        charity: Symbol,
        donation_percentage: u32,
        creator: Address,
        asset: Address,
    ) {
        if env.storage().instance().has(&POOL_INFO) {
            panic!("Pool already initialized");
        }

        let pool_info = PoolInfo {
            name,
            charity,
            donation_percentage,
            creator: creator.clone(),
            total_deposited: 0,
            total_donated: 0,
            asset,
        };

        env.storage().instance().set(&POOL_INFO, &pool_info);
        env.storage().instance().set(&TOTAL_DEPOSITED, &0i128);
    }

    /// Deposit assets to the pool
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance().get(&POOL_INFO).unwrap();
        
        // Transfer tokens from user to contract
        let token_client = token::Client::new(&env, &pool_info.asset);
        token_client.transfer(&user, &env.current_contract_address(), &amount);

        // Update user deposits
        let mut deposits: Map<Address, Vec<UserDeposit>> = env.storage()
            .instance()
            .get(&USER_DEPOSITS)
            .unwrap_or(Map::new(&env));

        let mut user_deposits = deposits.get(user.clone()).unwrap_or(Vec::new(&env));
        
        let deposit = UserDeposit {
            user: user.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
        };
        
        user_deposits.push_back(deposit);
        deposits.set(user.clone(), user_deposits);
        env.storage().instance().set(&USER_DEPOSITS, &deposits);

        // Update total deposited
        pool_info.total_deposited += amount;
        env.storage().instance().set(&POOL_INFO, &pool_info);

        // Emit deposit event
        env.events().publish(
            (symbol_short!("deposit"), user),
            (amount, env.ledger().timestamp())
        );
    }

    /// Withdraw assets from the pool
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();

        let user_balance = Self::get_user_balance(env.clone(), user.clone());
        if user_balance < amount {
            panic!("Insufficient balance");
        }

        let pool_info: PoolInfo = env.storage().instance().get(&POOL_INFO).unwrap();
        
        // Transfer tokens from contract to user
        let token_client = token::Client::new(&env, &pool_info.asset);
        token_client.transfer(&env.current_contract_address(), &user, &amount);

        // Record withdrawal as negative deposit
        let mut deposits: Map<Address, Vec<UserDeposit>> = env.storage()
            .instance()
            .get(&USER_DEPOSITS)
            .unwrap_or(Map::new(&env));

        let mut user_deposits = deposits.get(user.clone()).unwrap_or(Vec::new(&env));
        
        let withdrawal = UserDeposit {
            user: user.clone(),
            amount: -amount, // Negative for withdrawal
            timestamp: env.ledger().timestamp(),
        };
        
        user_deposits.push_back(withdrawal);
        deposits.set(user.clone(), user_deposits);
        env.storage().instance().set(&USER_DEPOSITS, &deposits);

        // Emit withdrawal event
        env.events().publish(
            (symbol_short!("withdraw"), user),
            (amount, env.ledger().timestamp())
        );
    }

    /// Get user's current balance
    pub fn get_user_balance(env: Env, user: Address) -> i128 {
        let deposits: Map<Address, Vec<UserDeposit>> = env.storage()
            .instance()
            .get(&USER_DEPOSITS)
            .unwrap_or(Map::new(&env));

        let user_deposits = deposits.get(user).unwrap_or(Vec::new(&env));
        let mut balance = 0i128;

        for i in 0..user_deposits.len() {
            if let Some(deposit) = user_deposits.get(i) {
                balance += deposit.amount;
            }
        }

        balance
    }

    /// Get pool information
    pub fn get_pool_info(env: Env) -> PoolInfo {
        env.storage().instance().get(&POOL_INFO).unwrap()
    }

    /// Process yield and donations (called by backend)
    pub fn process_yield(env: Env, yield_amount: i128, admin: Address) {
        admin.require_auth();

        let mut pool_info: PoolInfo = env.storage().instance().get(&POOL_INFO).unwrap();
        
        // Calculate donation amount
        let donation_amount = yield_amount * pool_info.donation_percentage as i128 / 100;
        
        pool_info.total_donated += donation_amount;
        env.storage().instance().set(&POOL_INFO, &pool_info);

        // Emit yield event
        env.events().publish(
            (symbol_short!("yield"), symbol_short!("process")),
            (yield_amount, donation_amount)
        );
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation};
    use soroban_sdk::{symbol_short, Address, Env};

    #[test]
    fn test_deposit_and_withdraw() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ImpactPoolContract);
        let client = ImpactPoolContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);
        let creator = Address::generate(&env);
        let asset = Address::generate(&env);

        // Initialize pool
        client.initialize(
            &symbol_short!("TEST"),
            &symbol_short!("CHARITY"),
            &50,
            &creator,
            &asset,
        );

        // Test deposit
        client.deposit(&user, &1000);
        assert_eq!(client.get_user_balance(&user), 1000);

        // Test withdrawal
        client.withdraw(&user, &300);
        assert_eq!(client.get_user_balance(&user), 700);
    }
}
