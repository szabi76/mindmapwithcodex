import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { ExplorationDocument } from '../types/index.js';

const { DYNAMODB_TABLE, AWS_REGION } = process.env;

if (!DYNAMODB_TABLE) {
  throw new Error('DYNAMODB_TABLE not set');
}

const client = new DynamoDBClient({ region: AWS_REGION ?? 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

export async function saveExploration(doc: ExplorationDocument) {
  await docClient.send(
    new PutCommand({
      TableName: DYNAMODB_TABLE,
      Item: doc
    })
  );
}

export async function getExploration(explorationId: string): Promise<ExplorationDocument | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: { explorationId }
    })
  );
  return (result.Item as ExplorationDocument | undefined) ?? null;
}

export async function deleteExploration(explorationId: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: DYNAMODB_TABLE,
      Key: { explorationId }
    })
  );
}

export async function listExplorationsForUser(userId: string, search?: string) {
  const params: QueryCommand['input'] = {
    TableName: DYNAMODB_TABLE,
    IndexName: 'userId-updatedAt-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false
  };

  const result = await docClient.send(new QueryCommand(params));
  const items = (result.Items as ExplorationDocument[] | undefined) ?? [];

  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter((item) =>
    item.searchableTerms.some((term) => term.toLowerCase().includes(lower))
  );
}

export async function updateExplorationState(doc: ExplorationDocument) {
  await docClient.send(
    new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: { explorationId: doc.explorationId },
      UpdateExpression:
        'set #states = :states, updatedAt = :updatedAt, currentStateIndex = :currentStateIndex, searchableTerms = :searchableTerms, mode = :mode',
      ExpressionAttributeNames: {
        '#states': 'states'
      },
      ExpressionAttributeValues: {
        ':states': doc.states,
        ':updatedAt': doc.updatedAt,
        ':currentStateIndex': doc.currentStateIndex,
        ':searchableTerms': doc.searchableTerms,
        ':mode': doc.mode
      }
    })
  );
}

export async function updateCurrentStateIndex(explorationId: string, index: number, updatedAt: string) {
  await docClient.send(
    new UpdateCommand({
      TableName: DYNAMODB_TABLE,
      Key: { explorationId },
      UpdateExpression: 'set currentStateIndex = :idx, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':idx': index,
        ':updatedAt': updatedAt
      }
    })
  );
}
