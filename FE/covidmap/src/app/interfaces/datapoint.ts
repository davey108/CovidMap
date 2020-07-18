export interface Datapoint {
  FIPS: string,
  StateFIPS: string,
  CountyFIPS: string,
  Date: number,
  Locality: string,
  NewCases: number,
  NewDeaths: number,
  TotalCases: number,
  TotalDeaths: number
}
