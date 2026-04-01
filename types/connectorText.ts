export function isConnectorTextBlock(block: any): boolean {
  return block?.type === 'connector_text';
}

export type ConnectorTextBlock = {
  type: 'connector_text';
  text: string;
};

export type ConnectorTextDelta = {
  type: 'connector_text_delta';
  text: string;
};
