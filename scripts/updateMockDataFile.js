import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base repo directory
const rootRepoDir = path.resolve(__dirname, '../..');
const sharedSyncPath = path.resolve(rootRepoDir, '.platform_sync.json');

const targetMockPaths = [
  path.resolve(rootRepoDir, 'bookvardiuser/src/data/mockData.js'),
  path.resolve(rootRepoDir, 'bookvardiseller/src/data/mockData.js'),
  path.resolve(rootRepoDir, 'bookvardiadmin/src/data/mockData.js')
];

function replaceExportInSource(src, name, val) {
  const prefix = `export const ${name} = `;
  const startIdx = src.indexOf(prefix);
  const formattedData = JSON.stringify(val, null, 2);

  if (startIdx === -1) {
    // Append at the end
    return src.trimEnd() + '\n\n' + prefix + formattedData + ';\n';
  }

  const afterStart = startIdx + prefix.length;
  // Look for next export statement or end of file
  const nextExportMatch = src.slice(afterStart).match(/\n(?=export (?:const|let|var|function|default))/);
  const endIdx = nextExportMatch ? afterStart + nextExportMatch.index : src.length;

  return src.slice(0, startIdx) + prefix + formattedData + ';' + src.slice(endIdx);
}

const keyMap = {
  products: 'ALL_PRODUCTS',
  ALL_PRODUCTS: 'ALL_PRODUCTS',
  orders: 'ORDERS',
  ORDERS: 'ORDERS',
  promotions: 'PROMOTIONS',
  PROMOTIONS: 'PROMOTIONS',
  schoolOrders: 'SCHOOL_ORDERS',
  SCHOOL_ORDERS: 'SCHOOL_ORDERS',
  customers: 'CUSTOMERS',
  CUSTOMERS: 'CUSTOMERS',
  sellers: 'SELLERS',
  SELLERS: 'SELLERS',
  users: 'USERS',
  USERS: 'USERS',
  PLATFORM_USERS: 'PLATFORM_USERS',
  reviews: 'REVIEWS',
  REVIEWS: 'REVIEWS',
  notifications: 'NOTIFICATIONS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  settings: 'SELLER_SETTINGS',
  SELLER_SETTINGS: 'SELLER_SETTINGS',
  platformSettings: 'PLATFORM_SETTINGS',
  PLATFORM_SETTINGS: 'PLATFORM_SETTINGS'
};

export function getSyncState() {
  try {
    if (fs.existsSync(sharedSyncPath)) {
      const content = fs.readFileSync(sharedSyncPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading shared sync state:', e);
  }
  return { revision: Date.now(), data: {} };
}

export function updateMockDataFile(updates = {}) {
  const revision = Date.now();

  // 1. Update shared sync JSON cache
  try {
    let currentState = {};
    if (fs.existsSync(sharedSyncPath)) {
      try {
        currentState = JSON.parse(fs.readFileSync(sharedSyncPath, 'utf8')) || {};
      } catch {
        currentState = {};
      }
    }
    const mergedState = {
      revision,
      updatedAt: new Date().toISOString(),
      data: {
        ...(currentState.data || {}),
        ...updates
      }
    };
    fs.writeFileSync(sharedSyncPath, JSON.stringify(mergedState, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing .platform_sync.json:', err);
  }

  // 2. Propagate updates into mockData.js across all 3 apps
  for (const filePath of targetMockPaths) {
    try {
      if (!fs.existsSync(filePath)) continue;

      let content = fs.readFileSync(filePath, 'utf8');

      for (const [key, data] of Object.entries(updates)) {
        const exportName = keyMap[key];
        if (!exportName || data === undefined) continue;
        content = replaceExportInSource(content, exportName, data);

        // Also keep PLATFORM_USERS in sync when users update
        if (exportName === 'USERS') {
          content = replaceExportInSource(content, 'PLATFORM_USERS', data);
        }
      }

      fs.writeFileSync(filePath, content, 'utf8');
    } catch (err) {
      console.error(`Error updating mockData at ${filePath}:`, err.message);
    }
  }

  return { success: true, revision };
}
