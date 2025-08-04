export const displayStartupSuccess = () => {
  console.log('\n🎉 ============================================');
  console.log('🎉 BACKEND STARTED SUCCESSFULLY!');
  console.log('🎉 ============================================');
  console.log('✅ MongoDB: Connected');
  console.log('✅ Azure OpenAI: Verified and working');
  console.log('✅ All routes: Mounted');
  console.log('✅ All middleware: Loaded');
  console.log('🚀 Ready to generate AI proposals!');
  console.log('🎉 ============================================\n');
};

export const displayStartupFailure = (reason) => {
  console.log('\n❌ ============================================');
  console.log('❌ BACKEND STARTUP FAILED!');
  console.log('❌ ============================================');
  console.log('❌ Reason:', reason);
  console.log('💡 Please fix the issue and restart the server.');
  console.log('❌ ============================================\n');
}; 