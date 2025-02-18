const axios = require("axios");
const config = require("../../../config.json");

async function getUUID(username) {
  try {
    const { data } = await axios.get(`${config.api.playerDBAPI}/${username}`);

    if (data.success === false || data.error === true) {
      throw data.message == "Mojang API lookup failed." ? "Invalid username." : data.message;
    }

    if (data.data?.player?.raw_id === undefined) {
      // eslint-disable-next-line no-throw-literal
      throw "No UUID found for that username.";
    }

    return data.data.player.raw_id;

  } catch (error) {
    throw error?.response?.data?.message == "Mojang API lookup failed." ? "Invalid username." : error?.response?.data?.message;
  }
}

async function getUsername(uuid) {
  try {
    const { data } = await axios.get(`${config.api.playerDBAPI}/${uuid}`);

    if (data.success === false || data.error === true) {
      throw data.message == "Mojang API lookup failed." ? "Invalid username." : data.message;
    }

    if (data.data?.player?.username === undefined) {
      // eslint-disable-next-line no-throw-literal
      throw "No username found for that UUID.";
    }

    return data.data.player.username;
    
  } catch (error) {
    throw error?.response?.data?.message == "Mojang API lookup failed." ? "Invalid username." : error?.response?.data?.message;
  }
}

module.exports = { getUUID, getUsername };