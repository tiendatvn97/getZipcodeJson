const fs = require("fs");
const readline = require("readline");

let f = [];
let jsonObject;
let resultMap = new Map();
let zipKeyString, zipNameString, areaNameString, nameGroupString;
let resultZipKey, resultZipName, resultNameGroup, resultAreaName;

const zipNameRegex = /(?<=^\s*\d{4}\s*).*$/,
  zipKeyRegex = /^[\s]*[\d]{4}/,
  pageNumberRegex = /^[\s]*[\d]+[\s]*$/,
  areaNameRegex = /^[\s]*[a-zA-z]+.*$/,
  nameGroupRegex = /(?<=^\s*-\s+).*$/;

function formatString(nameVariable) {
  switch (nameVariable) {
    case ('ZIPKEY'): {
      zipKeyString = zipKeyString.trim();
      zipKeyString = zipKeyString.replace(/[ ][\s]+/g," ");
      break;
    }
    case ('ZIPNAME'): {
      zipNameString = zipNameString.trim();
      zipNameString = zipNameString.replace(/[ ][\s]+/g," ");
      break;
    }
    case ('NAMEGROUP'): {
      nameGroupString = nameGroupString.trim();
      nameGroupString = nameGroupString.replace(/[ ][\s]+/g," ");
      break;
    }
    case ('AREANAME'): {  
      areaNameString = areaNameString.trim();
      areaNameString = areaNameString.replace(/[ ][\s]+/g," ");
      break;
    }
  }
}

function convertMaptoJson(){
  var object = {};
  resultMap.forEach((value, key) => {
    var keys = key.split('.'),
      last = keys.pop();
    keys.reduce((r, a) => r[a] = r[a] || {}, object)[last] = value;
  });
  return JSON.stringify(object);
}

const readFile = readline.createInterface({
  input: fs.createReadStream("zipcodeInput.txt"),
  output: fs.createWriteStream("zipcodeOutput.txt"),
  terminal: false
});

readFile.on("line", transform).on("close", function () {
  readFile.output.write(convertMaptoJson());
});

function transform(line) {
  //line is page number => return
  if (pageNumberRegex.test(line))
    return;

  // line is area's name => save area's name...then return
  if (areaNameRegex.test(line)) {
    resultAreaName = line.match(areaNameRegex);
    areaNameString = resultAreaName[0];
    formatString("AREANAME");
    return;
  }

  // line is name belong a group with same key => add name with 
  // corresponding key into resultMap...then return;
  if (nameGroupRegex.test(line)) {
    resultNameGroup = line.match(nameGroupRegex);
    nameGroupString = resultNameGroup[0];
    formatString("NAMEGROUP");
    f = [...resultMap.get(zipKeyString)];
    jsonObject = {
      "NAME": nameGroupString,
      "ADDRESS": areaNameString
    }
    f.push(jsonObject);
    resultMap.set(zipKeyString, f);
    return;
  }

  // line is zipcode key => check key if is in resultMap
  if (zipKeyRegex.test(line)) {
    resultZipKey = line.match(zipKeyRegex);
    zipKeyString = resultZipKey[0];
    formatString("ZIPKEY");

    resultZipName = line.match(zipNameRegex);
    zipNameString = resultZipName[0];
    formatString("ZIPNAME");

    jsonObject = {
      "NAME": zipNameString,
      "ADDRESS": areaNameString
    }
    // if zipcode key is in resultMap => add jsonObject into value array coressponding zipcode key 
    // if zipcode key isn't in resultMap => add (zipkey, jsonObject) into resultMap  
    if (resultMap.has(zipKeyString)) {
      f = [...resultMap.get(zipKeyString)];
      f.push(jsonObject)
      resultMap.set(zipKeyString, f);
    } else {
      f = [jsonObject];
      resultMap.set(zipKeyString, f);
    };
  }
  return;
}

