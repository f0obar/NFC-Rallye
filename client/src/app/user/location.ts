import {isNullOrUndefined} from "util";

export class Location {
  constructor(private name: string,
              private layer: number,
              private image: any,
              private latitude: any,
              private longitude: any) {}

  public getName(): string {
    return this.name;
  }
  public getLayer(): number {
    return this.layer;
  }
  public getImage(): any {
    return this.image;
  }
  public imageAvailable(): boolean {
    return !isNullOrUndefined(this.image) && !isNullOrUndefined(this.image.filetype) && this.image.filetype != "";
  }
  public getLongitude(): any {
    return this.longitude;
  }
  public getLatitude(): any {
    return this.latitude;
  }
}
