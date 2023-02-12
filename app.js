//Importing Package
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { response } = require("express");

// Giving Database Path
const databasePath = path.join(__dirname, "covid19India.db");

// Calling Express and defining Acceot JSON Format.
const app = express();
app.use(express.json());

//Initialization of Database and Server.
let database = null;

const initializationOfDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000")
    );
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializationOfDatabaseAndServer();

// Creating APIs

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const districtDbObjectToResponse = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1
app.get("/states/", async (request, response) => {
  const queryToGetAllState = `
    SELECT *
    FROM state`;
  const gettingAllState = await database.all(queryToGetAllState);
  response.send(
    gettingAllState.map((each) => convertDbObjectToResponseObject(each))
  );
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const queryToGetPartiState = `
     SELECT 
        *
     FROM 
        state
     WHERE 
        state_id = ${stateId}`;
  const getStatePerId = await database.get(queryToGetPartiState);
  response.send(convertDbObjectToResponseObject(getStatePerId));
});

//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const queryToCreateDistricts = `
    INSERT INTO 
        district(district_name, state_id, cases, cured, active, deaths)
    VALUES
        ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}')`;
  await database.run(queryToCreateDistricts);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const queryTOSearchByDistrict = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};`;
  const searchByDistrictId = await database.get(queryTOSearchByDistrict);
  response.send(districtDbObjectToResponse(searchByDistrictId));
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const queryToDeleteDistrict = `
    DELETE FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  const deleteDistrict = await database.run(queryToDeleteDistrict);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const queryToUpdateDistrict = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = '${stateId}',
        cases = '${cases}',
        cured = '${cured}',
        active = '${active}',
        deaths = '${deaths}'
    WHERE
        district_id = ${districtId};`;
  const puttingReq = await database.run(queryToUpdateDistrict);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const queryToGetStatePerDis = `
    SELECT 
        SUM(cases) AS cases, SUM(cured) AS cured, SUM(active) AS active, SUM(deaths) AS deaths
    FROM 
        district
    WHERE
        state_id = ${stateId};`;
  const stats = await database.get(queryToGetStatePerDis);
  response.send({
    totalCases: stats.cases,
    totalCured: stats.cured,
    totalActive: stats.active,
    totalDeaths: stats.deaths,
  });
});

// API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const queryToGetRes = `
    SELECT state_id AS state_id
    FROM district
    WHERE district_id = ${districtId};`;
  const gettingStateFromDist = await database.get(queryToGetRes);

  const querySecRes = `
  SELECT state_name AS stateName
  FROM state
  WHERE state_id = ${gettingStateFromDist.state_id};`;
  const secondRes = await database.get(querySecRes);
  response.send(secondRes);
});

module.exports = app;
