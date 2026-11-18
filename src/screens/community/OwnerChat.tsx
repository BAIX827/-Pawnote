import type { CommunitySession } from "./useCommunitySession";
import { socialStyles as s } from "../../components/CommunityMoment";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Field } from "../../components/ui";
import { id as uniqueId } from "../../domain/types";
import { writeCommunity } from "../../platform/community";
import { Action, Back, Heading, OfflineNotice } from "./CommunityControls";
export default function OwnerChat({
  session,
  peer,
}: {
  session: CommunitySession;
  peer: string;
}) {
  const { conversation, setConversation, real, setup } = session;
  const [message, setMessage] = useState("");
  const delivery = useRef({ nonce: uniqueId(), text: "" });
  return (
    <>
      <Back />
      <Heading>Owner chat</Heading>
      {conversation && (
        <>
          <Text style={s.meta}>
            {conversation.open
              ? "Both owners are open to chatting."
              : "Chat opens when both owners independently opt in."}
          </Text>
          {conversation.open && (
            <>
              {conversation.messages.map((m) => (
                <View key={m.id} style={s.reply}>
                  <Text style={s.meta}>{m.mine ? "You" : "Other owner"}</Text>
                  <Text style={s.copy}>{m.body}</Text>
                </View>
              ))}
              <Field
                accessibilityLabel="Message from you"
                value={message}
                onChangeText={setMessage}
                placeholder="Message as yourself"
                maxLength={1200}
              />
              <Action
                label="Send message"
                session={session}
                work={async () => {
                  if (delivery.current.text !== message)
                    delivery.current = { nonce: uniqueId(), text: message };
                  setConversation(
                    await writeCommunity("message", {
                      pet: peer,
                      text: message,
                      nonce: delivery.current.nonce,
                    }),
                  );
                  delivery.current = { nonce: uniqueId(), text: "" };
                  setMessage("");
                }}
                disabled={!message.trim()}
              />
            </>
          )}
          <Action
            label={
              conversation.willing
                ? "Withdraw my consent"
                : "I’m open to chatting"
            }
            session={session}
            work={async () => {
              await setup();
              setConversation(
                await writeCommunity("consent", {
                  pet: peer,
                  open: !conversation.willing,
                }),
              );
            }}
            disabled={!real}
          />
        </>
      )}
      <OfflineNotice />
    </>
  );
}
