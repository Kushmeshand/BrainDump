export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Collections: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  CreateNote: { noteId?: string } | undefined;
  CreateLink: { linkId?: string } | undefined;
  CreateImage: { uri?: string; uris?: string[]; imageId?: string };
  ImageViewer: { imageId: string };
  CollectionDetails: { collectionId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
