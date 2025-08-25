const { Client, Functions, Storage } = require('appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('689bdaf500072795b0f6')
    .setKey('standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc');

const functions = new Functions(client);
const storage = new Storage(client);

async function deployTradingPost() {
    try {
        console.log('🚀 Deploying Trading Post to AppWrite...');
        
        // Create function for backend
        const func = await functions.create(
            'trading-post-backend',
            'Trading Post Backend',
            'node-18.0',
            ['any'],
            [],
            '',
            15,
            true,
            true,
            '',
            'npm start',
            'npm install --legacy-peer-deps',
            '.'
        );
        
        console.log('✅ Function created:', func.$id);
        
        // Deploy the code
        const deployment = await functions.createDeployment(
            func.$id,
            'index.js',
            './trading-app-frontend/build.tar.gz',
            true
        );
        
        console.log('✅ Deployment created:', deployment.$id);
        console.log('🎉 Trading Post deployed successfully!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
    }
}

deployTradingPost();