/*
   Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


const qrcode = {};
qrcode.imagedata = null;
qrcode.width = 0;
qrcode.height = 0;
qrcode.qrCodeSymbol = null;
qrcode.debug = false;
qrcode.maxImgSize = 1024 * 1024;

qrcode.sizeOfDataLengthInfo = [[10, 9, 8, 8], [12, 11, 16, 10], [14, 13, 16, 12]];

qrcode.callback = null;

qrcode.decode = function (context, width, height) {
  if (width > 0 && height > 0) {
    qrcode.imagedata = context.getImageData(0, 0, width, height);
    qrcode.width = width;
    qrcode.height = height;

    try {
      qrcode.result = qrcode.process();
      if (qrcode.callback) {
        qrcode.callback(qrcode.result);
      }
    } catch (e) {
      // No QR Code detected yet
    }
  }
};

qrcode.isUrl = function (s) {
  const regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(s);
};

qrcode.decode_url = function (s) {
  var escaped = "";
  try {
    escaped = escape(s);
  }
  catch (e) {
    escaped = s;
  }
  var ret = "";
  try {
    ret = decodeURIComponent(escaped);
  }
  catch (e) {
    ret = escaped;
  }
  return ret;
};

qrcode.decode_utf8 = function (s) {
  if (qrcode.isUrl(s))
    return qrcode.decode_url(s);
  else
    return s;
};

qrcode.process = function () {
  const image = qrcode.grayScaleToBitmap(qrcode.grayscale());
  const detector = new Detector(image);

  const qRCodeMatrix = detector.detect();

  const reader = Decoder.decode(qRCodeMatrix.bits);
  const data = reader.DataByte;
  var str = "";
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++)
      str += String.fromCharCode(data[i][j]);
  }

  return qrcode.decode_utf8(str);
};

qrcode.getPixel = function (x, y) {
  if (qrcode.width < x) {
    throw "point error";
  }
  if (qrcode.height < y) {
    throw "point error";
  }
  const point = (x * 4) + (y * qrcode.width * 4);
  return (qrcode.imagedata.data[point] * 33 + qrcode.imagedata.data[point + 1] * 34 + qrcode.imagedata.data[point + 2] * 33) / 100;
};

qrcode.binarize = function (th) {
  const ret = new Array(qrcode.width * qrcode.height);
  for (var y = 0; y < qrcode.height; y++) {
    for (var x = 0; x < qrcode.width; x++) {
      var gray = qrcode.getPixel(x, y);

      ret[x + y * qrcode.width] = gray <= th;
    }
  }
  return ret;
};

qrcode.getMiddleBrightnessPerArea = function (image) {
  const numSqrtArea = 4;
  //obtain middle brightness((min + max) / 2) per area
  const areaWidth = Math.floor(qrcode.width / numSqrtArea);
  const areaHeight = Math.floor(qrcode.height / numSqrtArea);
  const minmax = new Array(numSqrtArea);
  for (var i = 0; i < numSqrtArea; i++) {
    minmax[i] = new Array(numSqrtArea);
    for (var i2 = 0; i2 < numSqrtArea; i2++) {
      minmax[i][i2] = new Array(0, 0);
    }
  }
  for (var ay = 0; ay < numSqrtArea; ay++) {
    for (var ax = 0; ax < numSqrtArea; ax++) {
      minmax[ax][ay][0] = 0xFF;
      for (var dy = 0; dy < areaHeight; dy++) {
        for (var dx = 0; dx < areaWidth; dx++) {
          const target = image[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width];
          if (target < minmax[ax][ay][0])
            minmax[ax][ay][0] = target;
          if (target > minmax[ax][ay][1])
            minmax[ax][ay][1] = target;
        }
      }
    }
  }
  const middle = new Array(numSqrtArea);
  for (var i3 = 0; i3 < numSqrtArea; i3++) {
    middle[i3] = new Array(numSqrtArea);
  }
  for (var ay = 0; ay < numSqrtArea; ay++) {
    for (var ax = 0; ax < numSqrtArea; ax++) {
      middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
    }
  }
  return middle;
};

qrcode.grayScaleToBitmap = function (grayScale) {
  const middle = qrcode.getMiddleBrightnessPerArea(grayScale);
  const sqrtNumArea = middle.length;
  const areaWidth = Math.floor(qrcode.width / sqrtNumArea);
  const areaHeight = Math.floor(qrcode.height / sqrtNumArea);

  const buff = new ArrayBuffer(qrcode.width * qrcode.height);
  const bitmap = new Uint8Array(buff);

  for (var ay = 0; ay < sqrtNumArea; ay++) {
    for (var ax = 0; ax < sqrtNumArea; ax++) {
      for (var dy = 0; dy < areaHeight; dy++) {
        for (var dx = 0; dx < areaWidth; dx++) {
          bitmap[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width] = (grayScale[areaWidth * ax + dx + (areaHeight * ay + dy) * qrcode.width] < middle[ax][ay]) ? true : false;
        }
      }
    }
  }
  return bitmap;
};

qrcode.grayscale = function () {
  const buff = new ArrayBuffer(qrcode.width * qrcode.height);
  const ret = new Uint8Array(buff);

  for (var y = 0; y < qrcode.height; y++) {
    for (var x = 0; x < qrcode.width; x++) {
      var gray = qrcode.getPixel(x, y);

      ret[x + y * qrcode.width] = gray;
    }
  }
  return ret;
};


function URShift(number, bits) {
  if (number >= 0)
    return number >> bits;
  else
    return (number >> bits) + (2 << ~bits);
}
