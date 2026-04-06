const fs = require('fs');
const inputPath = 'components/PromptInput/PromptInput.tsx';
let src = fs.readFileSync(inputPath, 'utf8');

// Replace the complicated border logic with a cleaner approach for the first prompt
// By removing Ink's built-in borders, we can simulate the "blue left border" and "grey background" using a parent Box and children.
const oldBoxRegex = /<Box flexDirection="row" alignItems="flex-start" justifyContent="flex-start" borderColor=\{messages\.length === 0 \? "#4285f4" : getBorderColor\(\)\} borderStyle=\{messages\.length === 0 \? "single" : "round"\} borderLeft=\{messages\.length === 0 \? true : false\} borderRight=\{false\} borderBottom=\{messages\.length === 0 \? false : true\} borderTop=\{messages\.length === 0 \? false : true\} backgroundColor=\{messages\.length === 0 \? "#1e1e1e" : undefined\} width=\{messages\.length === 0 \? Math\.floor\(columns \* 0\.6\) : "100%"\} alignSelf="center" borderText=\{messages\.length === 0 \? undefined : buildBorderText\(showFastIcon \?\? false, showFastIconHint, fastModeCooldown\)\} minHeight=\{messages\.length === 0 \? 2 : undefined\} paddingX=\{messages\.length === 0 \? 1 : 0\} paddingY=\{messages\.length === 0 \? 1 : 0\}>/g;

// If we can't find it, let's just do a simpler replace by reading the file and replacing the specific Box string
let targetPos = src.indexOf('<Box flexDirection="row" alignItems="flex-start" justifyContent="flex-start" borderColor={messages.length === 0 ? "#4285f4"');
if (targetPos > -1) {
  let endPos = src.indexOf('>', targetPos);
  
  const newBox = `
    {messages.length === 0 ? (
      <Box flexDirection="row" width={Math.floor(columns * 0.6)} alignSelf="center" height={5}>
        <Box width={1} backgroundColor="blue" />
        <Box flexGrow={1} backgroundColor="#1e1e1e" flexDirection="row" paddingX={1}>
          <PromptInputModeIndicator mode={mode} isLoading={isLoading} viewingAgentName={viewingAgentName} viewingAgentColor={viewingAgentColor} />
          <Box flexGrow={1} flexShrink={1} flexDirection="column" onClick={handleInputClick}>
            <Box flexGrow={1} paddingTop={1}>{textInputElement}</Box>
            <Box paddingBottom={1}>
              <Text color="blue">Build </Text><Text dimColor>{modelDisplayName}</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    ) : (
      <Box flexDirection="row" alignItems="flex-start" justifyContent="flex-start" borderColor={getBorderColor()} borderStyle="round" borderLeft={false} borderRight={false} borderBottom={true} width="100%" borderText={buildBorderText(showFastIcon ?? false, showFastIconHint, fastModeCooldown)}>
        <PromptInputModeIndicator mode={mode} isLoading={isLoading} viewingAgentName={viewingAgentName} viewingAgentColor={viewingAgentColor} />
        <Box flexGrow={1} flexShrink={1} flexDirection="column" onClick={handleInputClick}>
          <Box>{textInputElement}</Box>
        </Box>
      </Box>
    )}
  `;
  
  // Since we replaced the inner content too, we need to remove the original inner content.
  // The original inner content is:
  // <PromptInputModeIndicator ... />
  // <Box flexGrow={1} ... >
  //   <Box minHeight={...}>{textInputElement}</Box>
  //   ... Build modelDisplayName ...
  // </Box>
  // </Box>}
  
  const endOfBox = src.indexOf('</Box>}', targetPos);
  
  src = src.substring(0, targetPos - 4) + newBox + src.substring(endOfBox + 7);
  fs.writeFileSync(inputPath, src);
  console.log("Updated Box layout!");
} else {
  console.log("Could not find the target Box!");
}
