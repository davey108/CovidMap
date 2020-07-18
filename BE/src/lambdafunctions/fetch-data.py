import boto3
import json
import decimal

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
    table = boto3.resource('dynamodb').Table('United_States')
    if 'FIPS' in event:
        # TODO: Decide on defaults for start_date and end_date
        if 'start_date' in event or 'end_date' in event:
            key_condition_expression = 'FIPS = :FIPS AND Date BETWEEN :start_date AND :end_date'
            expression_attribute_values = {':FIPS': event['FIPS'], ':start_date': event['start_date'], ':end_date': event['end_date']}
        else:
            key_condition_expression = 'FIPS = :FIPS'
            expression_attribute_values = {':FIPS': event['FIPS']}

        response = table.query(
        KeyConditionExpression=key_condition_expression,
        ExpressionAttributeValues=expression_attribute_values
        )
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items'], cls=DecimalEncoder)
        }
    return {
        'statusCode': 400,
        'body': json.dumps('{"ERROR_MSG": "Mandatory key StateFIPS must be present in input JSON"}')
    }
