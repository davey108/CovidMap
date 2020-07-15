import boto3
import json
import decimal
from boto3.dynamodb.conditions import Key, Attr

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return int(o)
        return json.JSONEncoder.default(self,o)

def lambda_handler(event, context):
    """
    This function fetches data by FIPS, it returns a JSON which represents the number of cases and deaths for all counties in a state or a specific county

    @param dict event: The input JSON which contains the state and/or county FIPS
    @param context: The mandatory argument required in lambda function in AWS
    @return: The number of cases and deaths for all counties in a state or a specific county
    """
    table = boto3.resource('dynamodb').Table('USA')
    if 'StateFIPS' in event:
        key_condition_expression = Key('StateFIPS').eq(event['StateFIPS']) & Key('CountyFIPS').eq(event['CountyFIPS']) if 'CountyFIPS' in event and event['CountyFIPS'] != 'empty' else Key('StateFIPS').eq(event['StateFIPS'])
        response = table.query(
        KeyConditionExpression=key_condition_expression
        )
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'], cls=DecimalEncoder)
        }
    return {
        'statusCode': 400,
        'body': json.dumps('{"ERROR_MSG": "Mandatory key StateFIPS must be present in input JSON"}')
    }
