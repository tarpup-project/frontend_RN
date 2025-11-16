import { Text as RNText, TextProps, StyleSheet } from 'react-native';

export function Text(props: TextProps) {
  return (
    <RNText 
      {...props} 
      style={[styles.default, props.style]} 
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: 'GeistMono-Regular',
  },
});


  


// import { Text as RNText, TextProps, StyleSheet } from 'react-native';
// import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold, Geist_700Bold } from '@expo-google-fonts/geist';

// export function Text(props: TextProps) {
//   const [fontsLoaded] = useFonts({
//     Geist_400Regular,
//     Geist_500Medium, 
//     Geist_600SemiBold,
//     Geist_700Bold,
//   });

//   if (!fontsLoaded) {
//     return null;
//   }

//   return (
//     <RNText 
//       {...props} 
//       style={[styles.default, props.style]} 
//     />
//   );
// }

// const styles = StyleSheet.create({
//   default: {
//     fontFamily: 'Geist_400Regular',
//   },
// });