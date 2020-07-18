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
    if 'multiValueQueryStringParameters' in event:
        query_string_parameters = event['multiValueQueryStringParameters']
        if 'FIPS' in query_string_parameters:
            # TODO: Decide on defaults for start_date and end_date
            if 'start_date' in query_string_parameters or 'end_date' in query_string_parameters:
                key_condition_expression = 'FIPS = :FIPS AND Date BETWEEN :start_date AND :end_date'
                expression_attribute_values = {':FIPS': query_string_parameters['FIPS'][0], ':start_date': query_string_parameters['start_date'][0], ':end_date': query_string_parameters['end_date'][0]}
            else:
                key_condition_expression = 'FIPS = :FIPS'
                expression_attribute_values = {':FIPS': query_string_parameters['FIPS'][0]}

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
            'body': json.dumps('{"ERROR_MSG": "Mandatory key FIPS must be present in query params"}')
        }
    return {
        'statusCode': 400,
        'body': json.dumps('{"ERROR_MSG": "GET Request must provide query string parameters"}')
    }
