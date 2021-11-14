const express = require("express");
const CronJob = require("cron").CronJob;
const router = express.Router();
const axios = require("axios");
const lo = require("lodash");

const configs = require("../configs/configs");

const END_POINT = configs.endPoint;
const APPLICATION_JSON = configs.applicationJson;
const EMISSION_URL = configs.emisionUrl;
const TOKEN_URL = configs.tokenUrl;
const URL_DELETE = configs.urlDelete;
const URL_REENV_ZOHO = configs.urlReenvZoho;
const SEND_ZOHO = configs.sendZoho;

const getReenvios = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${END_POINT}reenvios`, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": APPLICATION_JSON
        }
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error.message);
      });
  });
};

const getToken = () => {
  return new Promise((resolve, reject) => {
    axios
      .get(
        TOKEN_URL,
        {
          grant_type: "client_credentials"
        },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": APPLICATION_JSON
          }
        }
      )
      .then(response => {
        let token = response.data[0].token;
        resolve(token);
      })
      .catch(error => {
        reject(error.message);
      });
  });
};

const facturActiva = (data, auth) => {
  return new Promise((resolve, reject) => {
    axios
      .post(EMISSION_URL, data, {
        headers: {
          CONTENT_TYPE: APPLICATION_JSON,
          Authorization: auth
        }
      })
      .then(response => {
        resolve(response.status);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const deleteReenvio = id => {
  return new Promise((resolve, reject) => {
    axios
      .delete(URL_DELETE + id, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": APPLICATION_JSON
        }
      })
      .then(response => {
        resolve(response.status);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const sendInvoiceToZoho = document => {
  return new Promise((resolve, reject) => {
    axios
      .post(URL_REENV_ZOHO, document, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": APPLICATION_JSON
        }
      })
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const resolver = job => {
  return new Promise(async (resolve, reject) => {
    const documents = await getReenvios().catch(err => console.log(err));
    if (documents) {
      let cleanDocuments = [];
      let dataPago = {};
      documents.forEach(document => {
        dataPago = document.dataPago;

        let detalle = document.detalle;
        const detalleClean = [];
        detalle.forEach(det => {
          detalleClean.push(lo.omit(det, "_id"));
        });

        let impuesto = document.impuesto;
        const impuestoClean = [];
        impuesto.forEach(imp => {
          impuestoClean.push(lo.omit(imp, "_id"));
        });

        let documento = lo.omit(document, "__v", "dataPago");
        documento.detalle = detalleClean;
        documento.impuesto = impuestoClean;
        documento.descuento = lo.omit(documento.descuento, "_id");
        documento.documento = lo.omit(documento.documento, "_id");
        cleanDocuments.push(documento);
      });
      const getValidToken = await getToken();
      if (getValidToken !== "") {
        for (let i = 0; i < cleanDocuments.length; i++) {
          let document = cleanDocuments[i];
          const sendFactura = await facturActiva(
            document,
            `Bearer ${getValidToken}`
          ).catch(async err => {
            // {
            //   2. "errors": [{
            //   3. "status": 400,
            //   4. "code": "51",
            //   5. "detail": "Campo tipoDocEmisor no puede estar vacio",
            //   6. "meta": {
            //   7. "reenvioHabilitado": true
            //   8. }
            //   9. }]
            //   10. }
            if (err.response) console.log(err.response.data.errors[0]);
            if (err.response !== undefined) {
              if (err.response.data.errors[0].meta) {
                if (
                  !err.response.data.errors[0].meta.reenvioHabilitado ||
                  err.response.data.errors[0].code === "51"
                ) {
                  console.log("Documento con problema:", document._id);
                  cleanDocuments.splice(i, 1);
                  i = i - 1;
                }
              } else {
                cleanDocuments.splice(i, 1);
                i = i - 1;
                await deleteReenvio(document._id).catch(err =>
                  console.log(err)
                );
              }
            }
          });
          if (sendFactura) {
            if (sendFactura === 200) {
              document.dataPago = dataPago;
              if (SEND_ZOHO)
                await sendInvoiceToZoho(document).catch(err =>
                  console.log(err)
                );
              await deleteReenvio(document._id).catch(err => console.log(err));
              cleanDocuments.splice(i, 1);
              i = i - 1;
            }
          }
        }

        const sleepDeamon = await getReenvios().catch(err => console.log(err));
        if (sleepDeamon.length === 0) {
          console.log("Daemon back to sleep =D");
          if (job) resolve(job.stop());
        } else {
          resolve(console.log("Unsolved problems:", sleepDeamon.length));
        }
      } else {
        resolve(console.log("no hay token"));
      }
    }
  });
};

router.post("/api/sendreenvios", async (req, res) => {
  res.json({ sms: "done" });

  console.log(`%c Daemon awaken!             .                                                .
    .n                   .                    .                  n.
.   .dP                  dP                   9b                 9b.    .
4    qXb         .       dX                     Xb       .        dXp     t
dX.    9Xb      .dXb    __                         __    dXb.     dXP     .Xb
9XXb._       _.dXXXXb dXXXXbo.                 .odXXXXb dXXXXb._       _.dXXP
9XXXXXXXXXXXXXXXXXXXVXXXXXXXXOo.           .oOXXXXXXXXVXXXXXXXXXXXXXXXXXXXP
9XXXXXXXXXXXXXXXXXXXXX~~~~~~OOO8b    d8OOO~~~~~XXXXXXXXXXXXXXXXXXXXXP
9XfactivaXXXP' 9XX'   EIDO    98v8P    TAB    XXP9XXXXXXXXXXXP
  ~~~~~~~       9X.          .db|db.          .XP       ~~~~~~~
                  )b.  .dbo.dPv9b.odb.  .dX(
               ,dXXXXXXXXXXXb   dXXXXXXXXXXXb.
               YesaXXXXXXXXP  .  9XXXXXXXXXXXb
             dXXXXXXXXXXXXb  d|b  dXXXXXXXXXXXXb
              9XXb   XXXXXb.dX|Xb.dXXXXX   dXXP
                     9apgcXX(   )XXXXXXP      
                        XXXX X.v.XmSedek
                        XP^Xb   dX^XX
                        X.9       P)X
                        b           d
                                      `);

  const job = new CronJob("* */5 * * * *", async () => {
    const d = new Date();
    // console.log("Every five Minutes:", d);
    await resolver();
  });
  job.start();
  await resolver(job);
});

module.exports = router;
