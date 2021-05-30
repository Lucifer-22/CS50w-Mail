document.addEventListener('DOMContentLoaded', function() {
  console.log("Everything SMOOTH!");

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = "";
  document.querySelector('#compose-subject').value = "";
  document.querySelector('#compose-body').value = "";

  
  
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;
    console.log(recipients); //to check if success
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
          subject: subject,
          body: body
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          document.body.scrollTop = document.documentElement.scrollTop = 0;
          document.querySelector('#error-message').innerHTML=`
            <div class="alert alert-danger" role="alert">
              <h3>Please recheck the id: ${recipients} for validity</h3>
            </div>`;

          console.log(`Please recheck the id: ${recipients} for validity`);   
          //alert(`Please recheck the id: ${recipients} for validity`) ;      
        }
        else {
          load_mailbox('sent');
          console.log("Email Sent successfully!");
        }
        /*
        if ("message" in result){
          // The email was sent successfully!
          load_mailbox('sent');
        }
        if ("error" in result){
          alert(`Please recheck the id: ${recipients} for validity`)
        }
        */
      });

    return false;
  };
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      if(mailbox === "sent") {
        sender_receiver = email.recipients;
      } else {
        sender_receiver = email.sender;
      }
      
      if(mailbox == "inbox"){
        if(email.read) is_read = "read";
        else is_read = "";
      }else is_read = "";
      
      //Now creating a div element 
      var item = document.createElement("div");
      item.className = `card ${is_read} text-dark items border-dark`
      item.innerHTML = `
        <div class="card-body" id="item-${email.id}">
        ${email.subject}
        <br><hr>
        ${sender_receiver} | ${email.timestamp}
        <br>
        </div>
      `;

      //Appending as list
      document.querySelector('#emails-view').appendChild(item);
      item.addEventListener('click', () => {
        complete_mail(email.id, mailbox);
      });
    });
  });
}

//Complete Mail logic here
function complete_mail(id, mailbox) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector('#emails-view').innerHTML="";
      
      // Creatimg div element
      var data = document.createElement("div");
      data.className = `card`;
      data.innerHTML = `
      <div class="card-body">
        <strong>From:</strong> ${email.sender}<br>
        <strong>To:</strong> ${email.recipients}<br>
        <strong>Subject:</strong> ${email.subject}<br>
        <strong>Timestamp:</strong> ${email.timestamp}<br>
        <hr>
        ${email.body} <hr>
      </div>
      `;
      document.querySelector('#emails-view').appendChild(data);
      
      //If mailbox page came from Sent no need to display any button
      if (mailbox === "sent"){
        return;
      }

      //Creating Archive button
      let archive = document.createElement("btn");
      archive.className = `btn btn-outline-danger btn-outline-info my-2`;
      archive.addEventListener('click', () => {
        makeArchive(id, email.archived);
        //Change button text
        if(archive.innerText == "Archive"){
          archive.innerText = "Unarchive";
        }else archive.innerText = "Archive";

      });

      //Creating Reply Icon
      let reply = document.createElement("div");
      reply.innerHTML=`<div>
        <button class="btn btn-outline-success btn-outline-info my-2 float-right" type="Submit">Reply</button>
      </div>`;
      
      reply.addEventListener('click', () => {
        compose_email();
        if (email.subject.slice(0,4) != "Re: ") {
          email.subject = `Re: ${email.subject}`;
        }
        document.querySelector('#compose-recipients').value = email.sender; //reply to the sender
        document.querySelector('#compose-subject').value = `${email.subject}`;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n\n`;
        
      });
        
      
      document.querySelector("#emails-view").appendChild(reply);
      

      if (!email.archived) archive.textContent = "Archive";
      else archive.textContent = "Unarchive";
      document.querySelector("#emails-view").appendChild(archive);
      markRead(id);

    });
}

//Archive function
function makeArchive(id, value){
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({archived: !value,}),
  });
  if(value == 0){
    load_mailbox("archive");
  }else{
    load_mailbox("inbox");
  }
}

//Function to mark email as read
function markRead(id){
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({read: true,}),
  });
}