/**
 * One-off cleanup script: removes direct-message entries from group_city_config.
 *
 * WhatsApp group JIDs end with @g.us.
 * Direct-message JIDs end with @s.whatsapp.net or @lid — the bot should never
 * have been sending alerts to those, but if they crept in this deletes them.
 *
 * Usage:
 *   node scripts/cleanup-direct-chats.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://onkcpzafpnvmgavliydr.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua2NwemFmcG52bWdhdmxpeWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDM2NDYsImV4cCI6MjA4NzI3OTY0Nn0.E5qmR2_qzqnzhv-fwTI_MgP_zPjlm--vhxnEZLj6paY';

const TABLE = 'group_city_config';

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Fetch all rows
  const { data: rows, error: fetchErr } = await supabase.from(TABLE).select('*');
  if (fetchErr) {
    console.error('Failed to fetch rows:', fetchErr.message);
    process.exit(1);
  }

  console.log(`\nTotal rows in ${TABLE}: ${rows.length}`);
  console.log('─'.repeat(70));

  const directChats = rows.filter(
    (r) => !r.group_id.endsWith('@g.us')
  );
  const groups = rows.filter((r) => r.group_id.endsWith('@g.us'));

  console.log(`\nGroup chats (will keep): ${groups.length}`);
  groups.forEach((r) =>
    console.log(`  ✓ [${r.enabled ? 'enabled ' : 'disabled'}] ${r.group_id}  "${r.group_name || ''}"  cities: ${(r.cities || []).join(', ')}`)
  );

  console.log(`\nDirect / unknown chats (will DELETE): ${directChats.length}`);
  if (directChats.length === 0) {
    console.log('  Nothing to delete — you\'re all clean!');
    return;
  }

  directChats.forEach((r) =>
    console.log(`  ✗ ${r.group_id}  "${r.group_name || ''}"  cities: ${(r.cities || []).join(', ')}`)
  );

  // 2. Confirm before deleting
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((resolve) => {
    rl.question('\nDelete these entries? [y/N] ', async (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        console.log('Aborted — nothing deleted.');
        resolve();
        return;
      }

      // 3. Delete them
      const idsToDelete = directChats.map((r) => r.group_id);
      const { error: delErr } = await supabase
        .from(TABLE)
        .delete()
        .in('group_id', idsToDelete);

      if (delErr) {
        console.error('Delete failed:', delErr.message);
      } else {
        console.log(`Deleted ${idsToDelete.length} row(s). Bot will no longer message those chats.`);
      }
      resolve();
    });
  });
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
