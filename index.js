// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const fetch = require('node-fetch');

process.env.DEBUG = "dialogflow:debug"; // enables lib debugging statements
const URL = process.env.URL;

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(
  (request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log(
      "Dialogflow Request headers: " + JSON.stringify(request.headers)
    );
    console.log("Dialogflow Request body: " + JSON.stringify(request.body));

    const randomText = (textList) => {
      const randomIndex = Math.floor(Math.random() * textList.length);
      return textList[randomIndex];
    }


    function welcome(agent) {
      agent.add(` Dime criatura, ¿qué quieres saber?`);
    }

    function fallback(agent) {
      agent.add(randomText([`No entiendo tu palabrería de mortal`, `Los humanos no sabeis hablar con dioses`]));
    }

    function requestUserKarmaScoreHandler(agent) {
      const userName = agent.parameters.nombre_usuario;

      return getKarmaScore(userName).then(({ karma }) => {
        if (karma <= 20) {
          agent.add(`${userName} tiene unos lamentables ${karma} puntos de karma`);
        } else if (karma <= 60) {
          agent.add(`${userName} tiene unos pobres ${karma} puntos de karma`);
        } else if (karma <= 80) {
          agent.add(`${userName} tiene unos decentes ${karma} puntos de karma`);
        } else {
          agent.add(`${userName} tiene unos impresionantes ${karma} puntos de karma`);
        }
      }).catch(() => {
        agent.add(`Oh! no soy capaz de ver los puntos de karma de ${userName}`);
      });
    }


    function getKarmaScore(userName) {
      return new Promise((resolve, reject) => {
        fetch(`${URL}?username=${userName}`)
          .then(res => res.json())
          .then(json => resolve(json))
          .catch(err => reject(err));
      });
    }

    function requestUserKarmaStateHandler(agent) {
      const userName = agent.parameters.nombre_usuario;
      agent.add(`Atentos mortales, voy a dar mi veredicto sobre ${userName}...`);
      return  fetch(`${URL}?username=${userName}`)
        .then(res => res.json())
        .then(({ karma }) => {
          if (karma <= 20) {
            agent.add(randomText([`${userName} va muy flojito, debería hacer una k.s. urgentemente`, `Le veo muy mal a ${userName}`]));
          } else if (karma <= 60) {
            agent.add(randomText([`${userName} está en el límite, que no se confíe`, `No me gusta mucho el camino que está siguiendo ${userName}`]));
          } else if (karma <= 80) {
            agent.add(randomText([`${userName} es un buen seguidor de mi religión`, `Va por buen camino ${userName}`]));
          } else {
            agent.add(randomText([`Algun día vereis a ${userName} si sigue así`, `${userName} es mi adalid en la tierra, seguidle todos`]));
          }
        })
        .catch(error => {
          console.log(error);
          agent.add(
            `Humano, no soy capaz de dar mi veredicto sobre ${userName}`
          );
        });
    }

    const addKarmaHandler = (agent) => {
      const userName = agent.parameters.nombre_usuario;
      agent.add(randomText([`De acuerdo mortal, otorgaré karma a ${userName}`,
      `¿Se ha portado bien ${userName}? Esta bien, le otorgaré karma`,
      `${userName} es uno de mis fieles favoritos, le daré karma`,
      `Así sea pues, otorgaré karma a ${userName}`]));

    }

    const removeKarmaHandler = (agent) => {
      const userName = agent.parameters.nombre_usuario;
      agent.add(randomText([`Los mortales sois crueles, tendré que quitar karma a ${userName}`,
      `Asi sea pues, ${userName} sufrirá mi colera`,
      `Tiembla ${userName}, aplastaré tu karma!`,
      `¿Es que ${userName} no va a aprender nunca? Tendré que aplastar su karma`]));
    }

    const goodbye = (agent) => {
      agent.add(randomText(['Vuelvo a mi reino, vuelve a invocarme cuando me necesites!',
        'Ya sabeis, sed buenos compañeros para que no tenga que volver a castigaros']));

    }

    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('requestUserKarma', requestUserKarmaScoreHandler);
    intentMap.set('requestUserKarmaState', requestUserKarmaStateHandler);
    intentMap.set('requestAddKarma', addKarmaHandler);
    intentMap.set('requestRemoveKarma', removeKarmaHandler);
    intentMap.set('goodbye', goodbye);
    agent.handleRequest(intentMap);
  });
