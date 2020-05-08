require("dotenv").config();
const { URL } = require("url");
const fetch = require("node-fetch");

// attach auth info to params

const attachAuthParams = (params) => {
  console.log(process.env.TRELLO_API_TOKEN);
  console.log(process.env.TRELLO_API_KEY);
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
};

// fetch board data

const fetchBoardData = async (idBoard) => {
  const url = new URL(`https://api.trello.com/1/boards/${idBoard}`);
  const params = url.searchParams;
  attachAuthParams(params);
  params.append("lists", "open");
  params.append("cards", "open");
  const response = await fetch(url.toString(), {
    method: "get",
    headers: { Accept: "application/json" },
  });
  console.log(response);
  return response.json();
};

// main handler

exports.handler = async (event, context) => {
  console.log("=== request accepted ===");

  if (event.httpMethod !== "GET") {
    raiseError("ERR: method is not GET");
    return {
      statusCode: 400,
      body: "Must GET to this function",
    };
  }

  const { idBoard } = event.queryStringParameters;

  const resp = await fetchBoardData(idBoard)

  console.log(resp);

  //const { idCard } = JSON.parse(event.body);

  //const card = await fetchCardData(idCard)
  //const boardData = await getListsFromBoard(card.idBoard);
  //const list = findParentList(card, boardData);

  return {
    statusCode: 200,
    body: JSON.stringify(resp),
  };
};
