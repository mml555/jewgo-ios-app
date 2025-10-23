#import <React/RCTConvert.h>
#import <MapKit/MapKit.h>

@interface RCTConvert (MKCoordinateRegion)
+ (MKCoordinateRegion)MKCoordinateRegion:(id)json;
@end


