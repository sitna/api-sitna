import Feature from 

export interface Filter {
}

export default interface FilterFactory {

    and(...filters: Filter[]): Filter;
    bbox(geometryName: string, extent: number[], srsName?: string): Filter;
    between(propertyName: string, lowerBoundary: number | string, upperBoundary: number | string): Filter;
    contains(propertyName: string, geometry: Feature, srsName?: string): Filter;
    disjoint(propertyName: string, geometry: Feature, srsName?: string): Filter;
    during(propertyName: string, timePeriod: any): Filter;
    dwithin(geometryName: string, geometry: Feature, distance: number, srsName?: string): Filter;
    equalTo(propertyName: string, expression: number | string, matchCase?: boolean): Filter;
    greaterThan(propertyName: string, value: number | string): Filter;
    greaterThanOrEqualTo(propertyName: string, value: number | string): Filter;
    intersects(propertyName: string, geometry: Feature, srsName?: string): Filter;
    isNull(propertyName: string): Filter;
    lessThan(propertyName: string, value: number | string): Filter;
    lessThanOrEqualTo(propertyName: string, value: number | string): Filter;
    like(propertyName: string, pattern: string, wildCard?: string, singleChar?: string, escapeChar?: string, matchCase?: boolean): Filter;
    not(filter: Filter): Filter;
    notEqualTo(propertyName: string, expression: number | string): Filter;
    or(...filters: Filter[]): Filter;
    within(propertyName: string, geometry: Feature, srsName?: string): Filter;
}