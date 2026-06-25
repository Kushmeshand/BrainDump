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
  CollectionDetails: { collectionId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
