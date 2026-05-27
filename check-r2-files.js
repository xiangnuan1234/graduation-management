const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

// Cloudflare R2 配置
const R2_ACCOUNT_ID = "your-account-id"; // 替换为你的 Account ID
const R2_ACCESS_KEY_ID = "your-access-key"; // 替换为你的 Access Key
const R2_SECRET_ACCESS_KEY = "your-secret-key"; // 替换为你的 Secret Key
const R2_BUCKET = "graduation-files";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function listFiles() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: "proposals/",
    });

    const response = await s3Client.send(command);
    
    if (response.Contents && response.Contents.length > 0) {
      console.log(`找到 ${response.Contents.length} 个文件:`);
      response.Contents.forEach(obj => {
        console.log(`- ${obj.Key} (${obj.Size} bytes)`);
      });
    } else {
      console.log("R2 存储桶中没有找到任何开题报告文件");
    }
  } catch (error) {
    console.error("错误:", error.message);
  }
}

listFiles();
