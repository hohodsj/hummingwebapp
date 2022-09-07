const {google} = require('googleapis');
const fs = require('fs');

const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const redirectUrl = process.env.GOOGLE_DRIVE_REDIRECT_URL;
const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
const client = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
client.setCredentials({ refresh_token: refreshToken });
const drive = google.drive({version: 'v3', auth:client});

createFolder = async (folderName) => {
    const resp = await searchFolder(folderName);
    if(resp) {
        console.log(`folder ${resp} found`);
        return resp;
    }
    console.log(`folder not found, creating folder ${folderName}`);
    return drive.files.create({
        resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id, name',
    });
}

searchFolder = (folderName) => {
    return new Promise((resolve, reject) => {
        drive.files.list(
            {
                q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`,
                fields: 'files(id, name)',
            },
            (err, res) => {
                if(err) return reject(err);
                return resolve(res.data.files ? res.data.files[0] : null);
            }
        );
    });
}

module.exports.saveFile = async(fileName, filePath, fileMimeType, folderName) => {
    // image urls: https://drive.google.com/uc?id=FILE_ID
    // or https://drive.google.com/uc?export=view&id={fileId}
    // https://drive.google.com/uc?id=13Gx4OE2GE_iHAV0tUjoQtyAiYZ5HgWTC
    const arkWorksFolder = await createFolder(folderName);
    console.log(`saving file ${fileName}`)
    return drive.files.create({
        requestBody: {
            name: fileName,
            mimeType: fileMimeType,
            parents: [arkWorksFolder.id]
        },
        media: {
            mimeType: fileMimeType,
            body: fs.createReadStream(filePath)
        }
    });
}

module.exports.deleteFile = async(id) => {
    return drive.files.delete({
        fileId: id
    });
}