#import "RCTConvert+MKCoordinateRegion.h"

@implementation RCTConvert (MKCoordinateRegion)

+ (MKCoordinateRegion)MKCoordinateRegion:(id)json
{
  NSDictionary *dict = [self NSDictionary:json];
  CLLocationDegrees lat = [self double:dict[@"latitude"]];
  CLLocationDegrees lng = [self double:dict[@"longitude"]];
  CLLocationDegrees latDelta = [self double:dict[@"latitudeDelta"]];
  CLLocationDegrees lngDelta = [self double:dict[@"longitudeDelta"]];
  
  CLLocationCoordinate2D center = CLLocationCoordinate2DMake(lat, lng);
  MKCoordinateSpan span = MKCoordinateSpanMake(latDelta, lngDelta);
  MKCoordinateRegion region = MKCoordinateRegionMake(center, span);
  
  return region;
}

@end


