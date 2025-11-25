const { withPodfile } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const FIREBASE_PODS = `  pod 'GoogleUtilities', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseCoreExtension', :modular_headers => true
  pod 'FirebaseInstallations', :modular_headers => true
  pod 'FirebaseMessaging', :modular_headers => true`;

const withFirebaseModularHeaders = (config) => {
  return withPodfile(config, async (config) => {
    const result = mergeContents({
      tag: 'firebase-modular-headers',
      src: config.modResults.contents,
      newSrc: FIREBASE_PODS,
      anchor: /prepare_react_native_project!/,
      offset: 1,
      comment: '#',
    });

    if (result.didMerge || result.didClear) {
      config.modResults.contents = result.contents;
    }
    return config;
  });
};

module.exports = withFirebaseModularHeaders;
