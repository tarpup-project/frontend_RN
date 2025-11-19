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
    fontFamily: 'Geist',
    fontWeight: '400'
  },
});


  
