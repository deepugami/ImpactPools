#!/usr/bin/env node

/**
 * Script to copy Sargam Icons to public directory
 * This ensures all icons used in the app are available
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../node_modules/sargam-icons/Icons/Line');
const targetDir = path.join(__dirname, '../public/icons');

// List of all icons we need for the ImpactPools app
const requiredIcons = [
  // Navigation & UI
  'si_Arrow_left.svg',
  'si_Arrow_right.svg', 
  'si_Arrow_upward.svg',
  'si_Arrow_downward.svg',
  'si_Add.svg',
  'si_Remove.svg',
  'si_Home.svg',
  'si_Chevron_left.svg',
  'si_Chevron_right.svg',
  
  // Financial & Business  
  'si_Money.svg',
  'si_User.svg',
  'si_Wallet.svg',
  'si_Insights.svg',
  
  // Status & Feedback
  'si_Heart.svg',
  'si_Check_circle.svg',
  'si_Error.svg',
  'si_Warning.svg',
  'si_Spinner.svg',
  
  // Data & Information
  'si_Clock.svg',
  'si_Info.svg',
  
  // Interactive Elements
  'si_Star.svg',
  'si_Search.svg',
  'si_Settings.svg',
  'si_Check.svg',
  'si_Close.svg',
  'si_More_horiz.svg',
  'si_More_vert.svg',
  
  // Additional useful icons
  'si_Copy.svg',
  'si_Edit_simple.svg',
  'si_File_download.svg',
  'si_File_upload.svg',
  'si_View.svg',
  'si_Link.svg',
  'si_Share.svg',
  'si_Filter_list.svg',
  'si_Sort.svg',
  'si_Grid.svg',
  'si_List.svg',
  'si_Bookmark.svg',
  'si_Calendar_time.svg',
  'si_Phone.svg',
  'si_Mail.svg',
  'si_Lock.svg',
  'si_Unlock.svg'
];

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Created directory: ${targetDir}`);
}

// Copy icons
let copiedCount = 0;
let skippedCount = 0;

requiredIcons.forEach(iconName => {
  const sourcePath = path.join(sourceDir, iconName);
  const targetPath = path.join(targetDir, iconName);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✓ Copied: ${iconName}`);
      copiedCount++;
    } catch (error) {
      console.error(`✗ Failed to copy ${iconName}:`, error.message);
    }
  } else {
    console.log(`⚠ Icon not found: ${iconName}`);
    skippedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`✓ Successfully copied: ${copiedCount} icons`);
console.log(`⚠ Skipped (not found): ${skippedCount} icons`);
console.log(`📁 Icons location: ${targetDir}`);
console.log(`\n🎉 Sargam Icons setup complete!`); 