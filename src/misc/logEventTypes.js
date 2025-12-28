const LogEventTypes = {
  MEMBER_JOIN: 'MEMBER_JOIN',
  MEMBER_LEAVE: 'MEMBER_LEAVE',
  MEMBER_KICK: 'MEMBER_KICK',
  MEMBER_BAN: 'MEMBER_BAN',
  MEMBER_UNBAN: 'MEMBER_UNBAN',

  MEMBER_TIMEOUT_ADD: 'MEMBER_TIMEOUT_ADD',
  MEMBER_TIMEOUT_REMOVE: 'MEMBER_TIMEOUT_REMOVE',

  MESSAGE_EDIT: 'MESSAGE_EDIT',
  MESSAGE_DELETE: 'MESSAGE_DELETE',
  MESSAGE_DELETE_BULK: 'MESSAGE_DELETE_BULK',

  INVITE_CREATE: 'INVITE_CREATE',
  INVITE_DELETE: 'INVITE_DELETE',

  VRC_LINKED: 'VRC_LINKED',
  VRC_UNLINKED: 'VRC_UNLINKED',

  NOTE_DELETED: 'NOTE_DELETED'
}
export default LogEventTypes


export const LogEventsObject = [
  //MEMBER_JOIN
  {
    eventType: LogEventTypes.MEMBER_JOIN,
    name: "Member Join",
    description: "Server Log for when a user joins the server.",
    relatedDetails: [
      "User", 
      "Account Created At"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  eventType:Member Join",
      "/mod logs view eventType:Member Join  detail:Account Created At  detailValue:23/12/2024"
    ]
  },
  //MEMBER_LEAVE
  {
    eventType: LogEventTypes.MEMBER_LEAVE,
    name: "Member Leave",
    description: "Server Log for when a user leaves the server.",
    relatedDetails: [
      "User",
      "Account Created At"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  eventType:Member Leave",
      "/mod logs view eventType:Member Leave  detail:Account Created At  detailValue:23/12/2024"
    ]
  },
  //MEMBER_KICK
  {
    eventType: LogEventTypes.MEMBER_KICK,
    name: "Member Kick",
    description: "Server Log for when a moderator kicks a user from the server.",
    relatedDetails: [
      "User",
      "Affected User",
      "Reason"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Member Kick",
      "/mod logs view eventType:Member Kick  detail:Reason  detailValue:Stinky"
    ]
  },
  //MEMBER_BAN
  {
    eventType: LogEventTypes.MEMBER_BAN,
    name: "Member Ban",
    description: "Server Log for when a moderator bans a user from the server.",
    relatedDetails: [
      "User",
      "Affected User",
      "Reason"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Member Ban",
      "/mod logs view eventType:Member Ban  detail:Reason  detailValue:Stinky"
    ]
  },
  //MEMBER_UNBAN
  {
    eventType: LogEventTypes.MEMBER_UNBAN,
    name: "Member Unban",
    description: "Server Log for when a moderator unbans a user from the server.",
    relatedDetails: [
      "User",
      "Affected User",
      "Reason"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Member Unban",
      "/mod logs view eventType:Member Unban  detail:Reason  detailValue:Stinky"
    ]
  },

  //MEMBER_TIMEOUT_ADD
  {
    eventType: LogEventTypes.MEMBER_TIMEOUT_ADD,
    name: "Timeout Add",
    description: "Server Log for when a moderator gives a user a timeout.",
    relatedDetails: [
      "User",
      "Affected User",
      "Timeout Length",
      "Reason"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Timeout Add  detail:Timeout Length  detailValue:20 minutes",
      "/mod logs view eventType:Timeout Add  detail:Reason  detailValue:Stinky"
    ]
  },
  //MEMBER_TIMEOUT_REMOVE
  {
    eventType: LogEventTypes.MEMBER_TIMEOUT_REMOVE,
    name: "Timeout Remove",
    description: "Server Log for when a moderator removes a user's timeout (untimeout).",
    relatedDetails: [
      "User",
      "Affected User",
      "Timeout Remaining",
      "Reason"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Timeout Remove  detail:Timeout Remaining  detailValue:5 minutes",
      "/mod logs view eventType:Timeout Remove  detail:Reason  detailValue:Stinky"
    ]
  },

  //MESSAGE_EDIT
  {
    eventType: LogEventTypes.MESSAGE_EDIT,
    name: "Message Edited",
    description: "Server Log for when a user edits one of their messages (bots are ignored).",
    relatedDetails: [
      "User",
      "Original Message",
      "Edited Message"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser eventType:Message Edited  detail:Original Message  detailValue:Stik",
      "/mod logs view eventType:Message Edited  detail:Edited Message  detailValue:Stinky"
    ]
  },
  //MESSAGE_DELETE
  {
    eventType: LogEventTypes.MESSAGE_DELETE,
    name: "Message Deleted",
    description: "Server Log for when a user, or moderator, deletes a message (bots are ignored).",
    relatedDetails: [
      "User",
      "Affected User",
      "Deleted Message"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  affectedUser:@affectedUser  eventType:Message Deleted  detail:Deleted Message  detailValue:Stinky",
      "/mod logs view eventType:Message Deleted  detail:Deleted Message  detailValue:Stinky"
    ]
  },
  //MESSAGE_DELETE_BULK
  {
    eventType: LogEventTypes.MESSAGE_DELETE_BULK,
    name: "Messages Bulk Deleted",
    description: "Server Log for when a moderator bulk deletes multiple messages. *(Use LogID when viewing Log to include file if it doesn't appear.)*",
    relatedDetails: [
      "User",
      "Bulk Deleted Messages File",
      "Bulk Deleted Messages Preview",
      "Bulk Deleted Messages Amount"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  eventType:Deleted Message  detail:Bulk Deleted Messages File Name  detailValue:bulkDelete32.txt",
      "/mod logs view eventType:Deleted Message  detail:Bulk Deleted Messages Amount  detailValue:12"
    ]
  },

  //INVITE_CREATE
  {
    eventType: LogEventTypes.INVITE_CREATE,
    name: "Invite Created",
    description: "Server Log for when a user creates an invite.",
    relatedDetails: [
      "User",
      "Invite Code",
      "Invite Channel",
      "Invite Length",
      "Invite Max Uses",
      "Invite Temporary"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  eventType:Invite Created  detail:Invite Length  detailValue:7 days",
      "/mod logs view eventType:Invite Created  detail:Invite Max Uses  detailValue:Unlimited"
    ]
  },
  //INVITE_DELETE
  {
    eventType: LogEventTypes.INVITE_DELETE,
    name: "Invite Deleted",
    description: "Server Log for when a moderator deletes an invite _(note: there is no log for when an invite expires)_.",
    relatedDetails: [
      "User",
      "Invite Code",
      "Invite Channel"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  eventType:Invite Deleted  detail:Invite Code  detailValue:xxxxxxx",
      "/mod logs view eventType:Invite Deleted  detail:Invite Channel  detailValue:channelName"
    ]
  },
  
  //VRC_LINKED
  {
    eventType: LogEventTypes.VRC_LINKED,
    name: "VRChat Linked",
    description: "Server Log for when a user links their VRChat profile to their Discord account.",
    relatedDetails: [
      "User",
      "VRChat User ID"
    ],
    viewExamples: [
      "/mod logs view user:@discordUser  eventType:VRChat Linked",
      "/mod logs view eventType:VRChat Linked  detail:VRChat User ID  detailValue:usr_00000000-0000-0000-0000-000000000000"
    ]
  },
  //VRC_UNLINKED
  {
    eventType: LogEventTypes.VRC_UNLINKED,
    name: "VRChat Unlinked",
    description: "Server Log for when a user, or moderator, unlinks their VRChat profile from their Discord account.",
    relatedDetails: [
      "User",
      "Affected User",
      "VRChat User ID"
    ],
    viewExamples: [
      "/mod logs view user:@moderator  affectedUser:@discordUser  eventType:VRChat Unlinked",
      "/mod logs view eventType:VRChat Unlinked  detail:VRChat User ID  detailValue:usr_00000000-0000-0000-0000-000000000000"
    ]
  },

  //NOTE_DELETED
  {
    eventType: LogEventTypes.NOTE_DELETED,
    name: "Usernote Deleted",
    description: "Server Log for when a moderator deletes a Usernote.",
    relatedDetails: [
      "User",
      "Affected User",
      "Usernote ID",
      "Usernote Note"
    ],
    viewExamples: [
      "/mod logs view user:@moderator  affectedUser:@discordUser  eventType:Usernote Deleted  detail:Usernote ID  detailValue:73",
      "/mod logs view eventType:Usernote Deleted  detail:Usernote Note  detailValue:Stinky"
    ]
  },
]