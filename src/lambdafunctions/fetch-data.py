import boto3
import json


def lambda_handler(event, context):
    client = boto3.client('dynamodb')
    if 'StateFIPS' in event:
        if 'CountyFIPS' in event and event['CountyFIPS'] != 'empty':
            key_condition_expression = 'StateFIPS = :StateFIPS AND CountyFIPS = :CountyFIPS'
            expression_attribute_values = { ':StateFIPS' : {'S': event['StateFIPS']}, ':CountyFIPS' : {'S': event['CountyFIPS']} }
        else:
            key_condition_expression = 'StateFIPS = :StateFIPS'
            expression_attribute_values = { ':StateFIPS' : {'S': event['StateFIPS']} }

        response = client.query(
        TableName='USA',
        KeyConditionExpression=key_condition_expression,
        ExpressionAttributeValues=expression_attribute_values)

        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'])
        }

    return {
        'statusCode': 400,
        'body': json.dumps('{"ERROR_MSG": "Mandatory key StateFIPS must be present in input JSON"}')
    }

print(lambda_handler({"StateFIPS": "51", "CountyFIPS": "empty"}, None))
