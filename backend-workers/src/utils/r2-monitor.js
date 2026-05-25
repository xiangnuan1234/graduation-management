/**
 * R2 存储额度监控工具
 * Cloudflare R2 免费额度：每月 10GB 存储 + 100万次 A 类操作 + 1000万次 B 类操作
 */

// 配置常量
const R2_FREE_TIER = {
  STORAGE_LIMIT: 10 * 1024 * 1024 * 1024, // 10GB
  CLASS_A_OPERATIONS_LIMIT: 1000000, // 100万次（写入、列表等）
  CLASS_B_OPERATIONS_LIMIT: 10000000, // 1000万次（读取等）
  WARNING_THRESHOLD: 0.85, // 85% 时发出警告
  CRITICAL_THRESHOLD: 0.95, // 95% 时严重警告
};

/**
 * 获取 R2 存储桶的使用统计信息
 */
export async function getR2UsageStats(env) {
  if (!env.FILES) {
    return {
      enabled: false,
      message: 'R2 存储未配置'
    };
  }

  try {
    // 获取存储桶中的所有对象
    let totalSize = 0;
    let objectCount = 0;
    let cursor = undefined;

    do {
      const listed = await env.FILES.list({ 
        limit: 1000,
        cursor 
      });
      
      for (const object of listed.objects) {
        totalSize += object.size;
        objectCount++;
      }
      
      cursor = listed.cursor;
    } while (cursor);

    // 计算使用率
    const storageUsagePercent = (totalSize / R2_FREE_TIER.STORAGE_LIMIT) * 100;
    
    // 估算操作次数（基于实际请求计数，这里简化处理）
    // 在生产环境中，应该使用 KV 或 D1 来跟踪操作次数
    const operationsEstimate = await getOperationsEstimate(env);

    return {
      enabled: true,
      storage: {
        used: totalSize,
        usedFormatted: formatBytes(totalSize),
        limit: R2_FREE_TIER.STORAGE_LIMIT,
        limitFormatted: formatBytes(R2_FREE_TIER.STORAGE_LIMIT),
        usagePercent: storageUsagePercent.toFixed(2)
      },
      objects: {
        count: objectCount
      },
      operations: operationsEstimate,
      status: getUsageStatus(storageUsagePercent),
      uploadAllowed: storageUsagePercent < 95 // 超过95%禁止上传
    };
  } catch (error) {
    console.error('Error getting R2 usage stats:', error);
    return {
      enabled: true,
      error: error.message,
      uploadAllowed: true // 出错时默认允许上传
    };
  }
}

/**
 * 检查是否允许上传文件
 */
export async function checkUploadAllowed(env) {
  const stats = await getR2UsageStats(env);
  
  if (!stats.enabled) {
    return {
      allowed: false,
      reason: 'R2 存储未配置',
      stats: null
    };
  }

  if (stats.error) {
    return {
      allowed: true, // 如果无法获取统计信息，默认允许
      reason: '无法获取使用统计，继续上传',
      stats: null
    };
  }

  if (!stats.uploadAllowed) {
    return {
      allowed: false,
      reason: `R2 存储空间已使用 ${stats.storage.usagePercent}%，接近免费额度上限（10GB）。为避免产生额外费用，已暂停文件上传功能。`,
      stats: stats
    };
  }

  // 检查文件大小限制
  const maxFileSize = getMaxFileSize(stats);
  
  return {
    allowed: true,
    reason: '可以上传',
    stats: stats,
    maxFileSize: maxFileSize,
    maxFileSizeFormatted: formatBytes(maxFileSize)
  };
}

/**
 * 根据当前使用情况获取最大允许的文件大小
 */
function getMaxFileSize(stats) {
  const remainingStorage = R2_FREE_TIER.STORAGE_LIMIT - stats.storage.used;
  const safetyBuffer = 0.1; // 保留 10% 的安全缓冲
  
  // 单个文件最大为剩余空间的 5%，但不超过 20MB
  const calculatedMax = Math.min(
    remainingStorage * 0.05,
    20 * 1024 * 1024 // 20MB 硬限制
  );
  
  return Math.max(calculatedMax, 1024 * 1024); // 至少 1MB
}

/**
 * 获取使用状态
 */
function getUsageStatus(usagePercent) {
  if (usagePercent >= 95) {
    return 'critical'; // 严重 - 禁止上传
  } else if (usagePercent >= 85) {
    return 'warning'; // 警告 - 可以上传但需要注意
  } else if (usagePercent >= 70) {
    return 'notice'; // 注意
  } else {
    return 'normal'; // 正常
  }
}

/**
 * 获取操作次数估算（简化版本）
 * 在生产环境中，应该使用 KV 或 D1 来准确跟踪
 */
async function getOperationsEstimate(env) {
  // 这里返回一个估算值
  // 实际项目中应该在每次 R2 操作时记录到 KV 或 D1
  return {
    classA: {
      estimated: 0,
      limit: R2_FREE_TIER.CLASS_A_OPERATIONS_LIMIT,
      usagePercent: 0
    },
    classB: {
      estimated: 0,
      limit: R2_FREE_TIER.CLASS_B_OPERATIONS_LIMIT,
      usagePercent: 0
    }
  };
}

/**
 * 格式化字节数为可读字符串
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 记录 R2 操作（用于跟踪操作次数）
 */
export async function recordR2Operation(env, operationType) {
  if (!env.KV) {
    // 如果没有 KV，跳过记录
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `r2_ops:${operationType}:${today}`;
    
    // 获取当前计数
    const currentCount = await env.KV.get(key);
    const newCount = (parseInt(currentCount) || 0) + 1;
    
    // 更新计数，设置 30 天过期
    await env.KV.put(key, newCount.toString(), { expirationTtl: 30 * 24 * 60 * 60 });
  } catch (error) {
    console.error('Error recording R2 operation:', error);
  }
}
