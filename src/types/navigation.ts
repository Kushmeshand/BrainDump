export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Collections: undefined;
  Favorites: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  CreateNote: { noteId?: string } | undefined;
  CreateLink: { linkId?: string } | undefined;
  CreateImage: { uri?: string; uris?: string[]; imageId?: string };
  ImageViewer: { imageId: string };
  CreatePdf: { uris?: string[]; pdfId?: string };
  PdfViewer: { pdfId: string };
  PdfDebug: { pdfId: string };
  CollectionDetails: { collectionId: string };
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
