const https = require('https');
const crypto = require('crypto');

console.log('🔍 Troubleshooting Appwrite API Authorization\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const apiKey = process.env.APPWRITE_API_KEY;

// Step 1: Validate API key format
console.log('1️⃣ API Key Validation:');
console.log(`   • Length: ${apiKey.length} characters`);
console.log(`   • Prefix: ${apiKey.substring(0, 8)}...`);
console.log(`   • Format: ${apiKey.startsWith('standard_') ? '✅ Standard API key format' : '❌ Non-standard format'}`);

// Step 2: Try different project IDs from CLAUDE.md
const projectTests = [
  { id: '68a4e3da0022f3e129d0', name: 'Primary Project (from request)' },
  { id: '689bdee000098bd9d55c', name: 'Trading Post Project' },
  { id: '689bdaf500072795b0f6', name: 'Recursion Chat Project' },
  { id: '68a0db634634a6d0392f', name: 'RPG/Slumlord Project' },
];

console.log('\n2️⃣ Testing Multiple Project IDs:');
console.log('   (API key might be for a different project)\n');

let testsCompleted = 0;
const results = [];

projectTests.forEach((project, index) => {
  setTimeout(() => {
    testProject(project.id, project.name, (result) => {
      results[index] = result;
      testsCompleted++;
      
      if (testsCompleted === projectTests.length) {
        analyzeResults();
      }
    });
  }, index * 500); // Stagger requests
});

function testProject(projectId, projectName, callback) {
  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/sites',
    method: 'GET',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const result = {
        projectId,
        projectName,
        statusCode: res.statusCode,
        success: res.statusCode === 200
      };
      
      if (res.statusCode === 200) {
        console.log(`   ✅ ${projectName}:`);
        console.log(`      Project ID: ${projectId}`);
        console.log(`      Status: AUTHORIZED - API key works!`);
        try {
          const parsed = JSON.parse(data);
          console.log(`      Sites found: ${parsed.total || 0}`);
          if (parsed.sites && parsed.sites.length > 0) {
            parsed.sites.forEach(site => {
              console.log(`      • ${site.$id}: ${site.name || 'Unnamed'}`);
            });
          }
        } catch (e) {}
      } else {
        console.log(`   ❌ ${projectName}: ${res.statusCode} Unauthorized`);
      }
      
      callback(result);
    });
  });
  
  req.on('error', e => {
    console.log(`   ❌ ${projectName}: Connection error`);
    callback({ projectId, projectName, statusCode: 0, success: false });
  });
  
  req.end();
}

function analyzeResults() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n3️⃣ Analysis Results:\n');
  
  const workingProjects = results.filter(r => r.success);
  
  if (workingProjects.length > 0) {
    console.log('🎯 SOLUTION FOUND!\n');
    console.log('The API key works with these projects:');
    workingProjects.forEach(p => {
      console.log(`   ✅ ${p.projectName}`);
      console.log(`      Project ID: ${p.projectId}`);
    });
    
    console.log('\n📝 Recommended Actions:');
    console.log('   1. Use the correct project ID in your deployment script');
    console.log('   2. Update the deployment configuration to:');
    console.log(`      Project ID: ${workingProjects[0].projectId}`);
    console.log('   3. The site ID (68aa1b51000a9c3a9c36) might belong to this project\n');
    
    // Generate corrected deployment script
    console.log('4️⃣ Corrected Deployment Command:\n');
    console.log(`   cd claude-deployment && \\`);
    console.log(`   APPWRITE_API_KEY="${apiKey.substring(0, 20)}..." \\`);
    console.log(`   APPWRITE_PROJECT_ID="${workingProjects[0].projectId}" \\`);
    console.log(`   node deploy-corrected.js`);
    
  } else {
    console.log('⚠️ NO WORKING PROJECT FOUND\n');
    console.log('Possible causes:');
    console.log('   1. API key has expired or been revoked');
    console.log('   2. API key lacks Sites API permissions');
    console.log('   3. Site ID belongs to a different account/project');
    console.log('   4. Appwrite Cloud service issue\n');
    
    console.log('📝 Recommended Actions:');
    console.log('   1. Generate a new API key with Sites permissions');
    console.log('   2. Verify the site ID (68aa1b51000a9c3a9c36) exists');
    console.log('   3. Check Appwrite Console for the correct project');
    console.log('   4. Use manual upload via Appwrite Console UI');
  }
  
  // Test if site ID exists in any working project
  if (workingProjects.length > 0) {
    console.log('\n5️⃣ Testing Site ID in Working Projects...\n');
    testSiteInProjects(workingProjects);
  }
}

function testSiteInProjects(projects) {
  const siteId = '68aa1b51000a9c3a9c36';
  
  projects.forEach(project => {
    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      path: `/v1/sites/${siteId}`,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': project.projectId,
        'X-Appwrite-Key': apiKey
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ SITE FOUND in ${project.projectName}!`);
          console.log(`      Site ID: ${siteId}`);
          console.log(`      Project: ${project.projectId}`);
          console.log('\n   🎉 Use this project ID for deployment!');
        } else {
          console.log(`   ❌ Site not found in ${project.projectName}`);
        }
      });
    });
    
    req.on('error', e => console.log(`   ❌ Error checking site in ${project.projectName}`));
    req.end();
  });
}