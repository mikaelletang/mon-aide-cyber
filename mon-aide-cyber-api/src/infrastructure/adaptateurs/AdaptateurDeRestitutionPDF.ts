import { AdaptateurDeRestitution } from '../../adaptateurs/AdaptateurDeRestitution';
import {
  Indicateurs,
  MesurePriorisee,
  Restitution,
} from '../../diagnostic/Diagnostic';
import * as pug from 'pug';
import puppeteer, { Browser, PDFOptions } from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

export class AdaptateurDeRestitutionPDF extends AdaptateurDeRestitution<Buffer> {
  constructor(private readonly traductionThematiques: Map<string, string>) {
    super();
  }

  protected genere(mesures: Promise<ContenuHtml>[]) {
    return Promise.all(mesures)
      .then((htmls) => generePdfs(htmls))
      .then((pdfs) => fusionnePdfs(pdfs))
      .catch((erreur) => {
        console.log('Erreur génération recos', erreur);
        throw new Error(erreur);
      });
  }

  protected genereInformations(_: Restitution): Promise<ContenuHtml> {
    return Promise.resolve({ entete: '', corps: '', piedPage: '' });
  }

  protected genereIndicateurs(
    indicateurs: Indicateurs | undefined,
  ): Promise<ContenuHtml> {
    return this.genereHtml('restitution-page-de-garde', {
      indicateurs,
      traductions: this.traductionThematiques,
    });
  }

  protected genereAutresMesures(
    autresMesures: MesurePriorisee[] | undefined,
  ): Promise<ContenuHtml> {
    return this.genereHtml('mesures.annexe', {
      mesures: autresMesures,
    });
  }

  protected genereMesuresPrioritaires(
    mesuresPrioritaires: MesurePriorisee[] | undefined,
  ): Promise<ContenuHtml> {
    return this.genereHtml('mesures', {
      mesures: mesuresPrioritaires,
    });
  }

  async genereHtml(pugCorps: string, paramsCorps: any): Promise<ContenuHtml> {
    const fonctionInclusionDynamique = (
      cheminTemplatePug: string,
      options = {},
    ) => {
      return pug.renderFile(
        `src/infrastructure/restitution/pdf/modeles/${cheminTemplatePug}`,
        options,
      );
    };
    const piedPage = pug.compileFile(
      `src/infrastructure/restitution/pdf/modeles/${pugCorps}.piedpage.pug`,
    )();
    return Promise.all([
      pug.compileFile(
        `src/infrastructure/restitution/pdf/modeles/${pugCorps}.pug`,
      )({
        ...paramsCorps,
        include: fonctionInclusionDynamique,
      }),
      pug.compileFile(
        `src/infrastructure/restitution/pdf/modeles/${pugCorps}.entete.pug`,
      )(),
    ])
      .then(([corps, entete]) => ({ corps, entete, piedPage }))
      .catch((erreur) => {
        console.log('Erreur génération HTML', erreur);
        throw new Error(erreur);
      });
  }
}

const fusionnePdfs = (pdfs: Buffer[]): Promise<Buffer> => {
  const fusionne = (fusion: PDFDocument): Promise<PDFDocument> => {
    return pdfs.reduce(
      (pdfDocument, pdf) =>
        pdfDocument.then((f) =>
          PDFDocument.load(pdf)
            .then((document) =>
              f.copyPages(document, document.getPageIndices()),
            )
            .then((copie) => copie.forEach((page) => f.addPage(page)))
            .then(() => pdfDocument),
        ),
      Promise.resolve(fusion),
    );
  };

  return PDFDocument.create()
    .then((fusion) => {
      return fusionne(fusion);
    })
    .then((fusion) => fusion.save())
    .then((pdf) => Buffer.from(pdf));
};

export type ContenuHtml = { corps: string; entete: string; piedPage: string };

const generePdfs = async (pagesHtml: ContenuHtml[]): Promise<Buffer[]> => {
  const pagesHtmlRemplies = pagesHtml.filter(
    (pageHtml) =>
      pageHtml.entete !== '' &&
      pageHtml.corps !== '' &&
      pageHtml.piedPage !== '',
  );

  const navigateur = await lanceNavigateur();
  try {
    const pages = pagesHtmlRemplies.map((pageHtml) =>
      navigateur.newPage().then((page) =>
        page
          .setContent(pageHtml.corps)
          .then(() => page.pdf(formatPdfA4(pageHtml.entete, pageHtml.piedPage)))
          .catch((erreur) => {
            console.log(erreur);
            throw erreur;
          }),
      ),
    );
    return await Promise.all(pages);
  } catch (erreur) {
    console.log(erreur);
    throw erreur;
  } finally {
    navigateur.close();
  }
};

const formatPdfA4 = (enteteHtml: string, piedPageHtml: string): PDFOptions => ({
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: enteteHtml,
  footerTemplate: piedPageHtml,
  margin: { bottom: '2cm', left: '1cm', right: '1cm', top: '23mm' },
});

const lanceNavigateur = (): Promise<Browser> =>
  puppeteer.launch({
    // Documentation des arguments : https://peter.sh/experiments/chromium-command-line-switches/
    // Inspiration pour la liste utilisée ici : https://www.bannerbear.com/blog/ways-to-speed-up-puppeteer-screenshots/
    // Le but est d'avoir un Puppeteer le plus léger et rapide à lancer possible.
    args: [
      '--no-sandbox',
      '--font-render-hinting=none',
      '--disable-gpu',
      '--autoplay-policy=user-gesture-required',
      '--disable-accelerated-2d-canvas',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-domain-reliability',
      '--disable-extensions',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-sync',
      '--hide-scrollbars',
      '--ignore-gpu-blacklist',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--no-pings',
      '--no-zygote',
      '--password-store=basic',
      '--single-process',
      '--use-gl=swiftshader',
      '--use-mock-keychain',
    ],
  });
