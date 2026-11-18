import { useState } from "react";
import { Field } from "../../components/ui";
import { MomentCard, LinkButton } from "../../components/CommunityMoment";
import { writeCommunity } from "../../platform/community";
import { Action, Back, Heading, OfflineNotice } from "./CommunityControls";
import type { CommunitySession } from "./useCommunitySession";
export default function MomentDetail({
  session,
}: {
  session: CommunitySession;
}) {
  const { detail, real, setup, afterMutation } = session;
  const [confirm, setConfirm] = useState(""),
    [reason, setReason] = useState("");
  return (
    <>
      <Back />
      {detail && (
        <>
          <MomentCard post={detail} expanded />
          {detail.met && (
            <>
              <Heading>{detail.name + " met " + detail.met.name}</Heading>
              <MomentCard post={detail.met} expanded />
            </>
          )}
          {detail.own ? (
            <>
              {confirm === "withdraw" ? (
                <Action
                  label="Confirm withdrawal"
                  session={session}
                  work={async () => {
                    await writeCommunity("withdraw", {
                      id: detail.id,
                    });
                    afterMutation();
                  }}
                />
              ) : (
                <LinkButton
                  label="Withdraw public moment"
                  onPress={() => setConfirm("withdraw")}
                />
              )}
            </>
          ) : (
            real && (
              <>
                {confirm === "report" ? (
                  <>
                    <Field
                      accessibilityLabel="Reason for report"
                      placeholder="Reason for reporting"
                      value={reason}
                      onChangeText={setReason}
                      maxLength={300}
                    />
                    <Action
                      label="Submit report"
                      session={session}
                      work={async () => {
                        await setup();
                        await writeCommunity("report", {
                          id: detail.id,
                          reason,
                        });
                        afterMutation();
                      }}
                      disabled={!reason.trim()}
                    />
                  </>
                ) : (
                  <LinkButton
                    label="Report moment"
                    onPress={() => setConfirm("report")}
                  />
                )}
              </>
            )
          )}
        </>
      )}
      <OfflineNotice />
    </>
  );
}
