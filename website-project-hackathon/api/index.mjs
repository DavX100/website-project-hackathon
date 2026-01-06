/**
 * Upload this to the AWS Lambda
 */

import { ListTablesCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  UpdateCommand,
  PutCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const tableName = "calendar-events";

 
export const handler = async (event, context) => {
  let response;

  switch (event.httpMethod) {
    case "GET":
      response = await handleGetRequest();
      break;
    case "POST":
      response = await handlePostRequest(event, context);
      break;
    case "PUT":
      response = await handleUpdateRequest(event);
      break;
    case "DELETE":
      response = await handleDeleteRequest(event);
      break;
    default:
      response = {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request type",
          event: event,
          context: context,
        }),
      };
  }

  return response;
};

const handleGetRequest = async () => {
  const command = new ScanCommand({
    TableName: tableName,
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(response.Items),
  };
};

const handlePostRequest = async (event, context) => {
  const { _id, description, allDay, start, end } = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      id: _id,
      description,
      allDay,
      start,
      end,
    },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Task created successfully" }),
  };
};

export const handleUpdateRequest = async (event, context) => {
  const { _id, description, allDay, start, end } = JSON.parse(event.body);

  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      id: _id,
    },
    UpdateExpression: "set description = :d, allDay = :a, start = :s, end = :e",
    ExpressionAttributeValues: {
      ":d": description,
      ":a": allDay,
      ":s": start,
      ":e": end,
    },
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Task updated successfully",
      task: response.Attributes,
    }),
  };
};

const handleDeleteRequest = async (event) => {
  const { _id } = JSON.parse(event.body);

  const command = new DeleteCommand({
    TableName: tableName,
    Key: { id: _id },
    ReturnValues: "ALL_OLD",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Task deleted successfully",
      task: response.Attributes,
    }),
  };
};