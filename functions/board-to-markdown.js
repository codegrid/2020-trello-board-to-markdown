const { URL } = require("url");
const fetch = require("node-fetch");
const escapeMarkdown = require("escape-markdown");
const _ = require("lodash");

// list filtering helpers

const LIST_REGEXP_TO_EXCLUDE = [
  /^\[WIP\]/,
  /近日対応予定/,
  /対応時期未定/,
  /未処理/,
];

const filterLists = (lists) => {
  return lists.filter((list) => {
    let useThisList = true;
    LIST_REGEXP_TO_EXCLUDE.forEach((regExp) => {
      if (regExp.test(list.name)) useThisList = false;
    });
    return useThisList;
  });
};

// Trello API communicators

const attachAuthParams = (params) => {
  params.append("key", process.env.TRELLO_API_KEY);
  params.append("token", process.env.TRELLO_API_TOKEN);
};

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
  return response.json();
};

// generate markdown! yey

const generateMarkdown = (boardData) => {
  const e = escapeMarkdown;

  // board name & desc
  let output = `# ${e(boardData.name)}\n\n`;
  output += `${e(boardData.desc)}\n\n`;

  // each list
  filterLists(boardData.lists).forEach((list) => {
    const idList = list.id;

    // list name
    output += `## ${e(list.name.replace(/⭕ ?/, ""))}\n\n`;

    // get cards
    let cards = boardData.cards.filter((card) => card.idList === idList);

    cards.forEach((card) => {
      let tagsText = card.labels.reduce((acc, label) => {
        return `${acc}[${label.name}]`;
      }, "");
      tagsText = tagsText ? `${e(tagsText)} ` : "";
      output += `- ${tagsText}[${e(card.name)}](${card.shortUrl})\n`;
    });

    // spacing
    output += `\n`;
  });
  return output;
};

// main handler

exports.handler = async (event, context) => {
  console.log("=== request accepted ===");

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 400,
      body: "Must GET to this function",
    };
  }

  const { idBoard } = event.queryStringParameters;
  const boardData = await fetchBoardData(idBoard);
  const md = generateMarkdown(boardData);

  return {
    statusCode: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
    body: md,
  };
};
