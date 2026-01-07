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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
 
export const handler = async (event, context) => {
  const method =
    event.httpMethod ||
    event?.requestContext?.http?.method ||   // HTTP API v2 / Lambda Function URL
    event?.requestContext?.httpMethod;       // sometimes seen in older variants

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }
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

  return {
    ...response,
    headers: corsHeaders,
  };
};

const handleGetRequest = async () => {
  const command = new ScanCommand({
    TableName: tableName,
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
    },
    body: JSON.stringify(response.Items),
  };
};

const handlePostRequest = async (event, context) => {
  const { _id, description, allDay, startDate, endDate } = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      id: _id,
      description,
      allDay,
      startDate,
      endDate,
    },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
    },
    body: JSON.stringify({ message: "Task created successfully" }),
  };
};

export const handleUpdateRequest = async (event, context) => {
  const { _id, description, allDay, startDate, endDate } = JSON.parse(event.body);

  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      id: _id,
    },
    UpdateExpression: "set #description = :d, #allDay = :a, #startDate = :s, #endDate = :e",
    ExpressionAttributeNames: {
      '#description': 'description',
      '#allDay': 'allDay',
      '#startDate': 'startDate',
      '#endDate': 'endDate',
    },
    ExpressionAttributeValues: {
      ":d": description,
      ":a": allDay,
      ":s": startDate,
      ":e": endDate,
    },
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders,
    },
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
    headers: {
      ...corsHeaders,
    },
    body: JSON.stringify({
      message: "Task deleted successfully",
      task: response.Attributes,
    }),
  };
};