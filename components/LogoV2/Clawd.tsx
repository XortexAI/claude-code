import * as React from 'react';
import { Box, Text } from '../../ink.js';

export function Clawd() {
  return (
    <Box flexDirection="column" alignItems="center">    
      <Text color="clawd_body" bold>  █    █ </Text>
      <Text color="clawd_body" bold>  ██  ██ </Text>
      <Text color="clawd_body" bold>   ████  </Text>
      <Text color="clawd_body" bold>  ██  ██ </Text>
      <Text color="clawd_body" bold>  █    █ </Text>
    </Box>
  );
}
