require('dotenv').config()

const GroupMe = require('groupme').Stateless

function promisify(f) {
  return function (...args) { // return a wrapper-function
    return new Promise((resolve, reject) => {
      function callback(err, result) { // our custom callback for f
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }

      args.push(callback); // append our custom callback to the end of f arguments

      f.call(this, ...args); // call the original function
    });
  };
};

const { GROUPME_TOKEN: apiToken, GROUPME_GROUP_NUM: groupNumber } = process.env;

const getUser = async () => promisify(GroupMe.Users.me)(apiToken);
const getGroups = async () => promisify(GroupMe.Groups.index)(apiToken);
const newMessage = async (...args) => promisify(GroupMe.Messages.create)(apiToken, ...args);

async function main() {
  const cliArgs = process.argv.slice(2);
  const groups = await getGroups();
  const plexGroup = groups.find(group => group.id === groupNumber);
  if (!plexGroup) {
    console.error(`Plex group with id ${groupNumber} not found`);
    process.exit(1);
  }
  const eventType = process.env.sonarr_eventtype || process.env.radarr_eventtype;
  const assetTitle = process.env.sonarr_series_title || process.env.radarr_movie_title;
  if (eventType === 'Rename') {
    console.log('just renamed')
    process.exit(0);
  }
  await newMessage(plexGroup.id, {
    message: {
      text: `${eventType}ed ${assetTitle || 'Test'}`
    }
  })
}

main();
