import axios from 'axios';
import log from './utils/logger.js';
import bangToib from './utils/banner.js'
import fs from 'fs';

const filePath = 'tokens.txt';

// read tokens from file
async function readTokens() {
    try {
        const fileContent = await fs.promises.readFile(filePath, 'utf8');

        const tokens = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        return tokens;
    } catch (error) {
        log.error('Error reading tokens.txt:', error.message);
    }
}

// start mining 
async function startMining(token) {
    const url = 'https://api.unich.com/airdrop/user/v1/mining/start';
    const payload = {};

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        log.info(`Mining started successfully: ${JSON.stringify(response.data)}`);
    } catch (error) {
        log.error("Error starting mining:", error.response ? error.response.data : error.message);
    }
}

//fetch social tasks
async function getSocialListByUser(token) {
    const url = 'https://api.unich.com/airdrop/user/v1/social/list-by-user';

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.data;
    } catch (error) {
        log.error("Error fetching social list by user:", error.response ? error.response.data : error.message);
        return null;
    }
}

//fetch recent mining data
async function getRecentMining(token) {
    const url = 'https://api.unich.com/airdrop/user/v1/mining/recent';

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        log.error("Error fetching recent mining data:", error.response ? error.response.data : error.message);
        return null;
    }
}

async function claimSocialReward(token, taskId) {
    const url = `https://api.unich.com/airdrop/user/v1/social/claim/${taskId}`;
    const payload = {
        "evidence": taskId
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        log.info(`Claim successful:  ${JSON.stringify(response.data)}`,);
    } catch (error) {
        log.error("Error claiming reward:", error.response ? error.response.data : error.message);
    }
}

// Main function
async function start() {
    log.info(bangToib)
    const tokens = await readTokens();
    while (true) {
        for (const token of tokens) {
            const recent = await getRecentMining(token);
            const isMining = recent?.data?.isMining;
            const balance = recent?.data?.mUn;

            log.info(`Mining : ${isMining} | Total Points : ${balance}`);

            if (!isMining) {
                await startMining(token);
            } else {
                log.info("Mining already started.");
            }

            const tasks = await getSocialListByUser(token);
            if (!tasks) return;

            const unclaimedIds = tasks.items
                .filter(item => !item.claimed)
                .map(item => item.id);

            log.info(`Found ${unclaimedIds.length} Unclaimed tasks`);

            for (const taskId of unclaimedIds) {
                log.info(`Trying to complete task ID: ${taskId}`);
                await claimSocialReward(token, taskId);
            };
        };
        log.warn("Cooldown 1 hours before checking again...")
        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
    };
};

// run
start();
