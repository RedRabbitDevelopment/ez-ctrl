
let users = [];
users.reset = function() {
  users.splice(0, users.length);
  users.push({
    id: 0,
    name: 'Nathan',
    male: true
  });
  users.push({
    id: 1,
    male: true,
    name: 'Kevin'
  });
};
users.reset();

export {users as data};

let User = {
  query(query) {
    return new Promise( (resolve, reject)=> {
      let found = users.filter( (user)=> {
        for(let key in query) {
          if(user[key] !== query[key]) return false;
        }
        return true;
      });
      resolve(users);
    });
  },
  getIndex(id) {
    return users.findIndex( (user)=> user.id === id );
  },
  get(id) {
    return new Promise( (resolve, reject)=> {
      resolve(users[this.getIndex(id)]);
    });
  },
  create(user) {
    return new Promise( (resolve, reject)=> {
      user.id = users[users.length - 1].id + 1;
      users.push(user);
      resolve(user);
    });
  },
  update(id, attributes) {
    delete attributes.id;
    return this.get(id).then( (user)=> {
      if(user) Object.assign(user, attributes);
      return user;
    });
  },
  remove(id) {
    return new Promise( (resolve, reject)=> {
      let index = this.getIndex(id);
      let found = index !== -1;
      if(found) {
        users.splice(index, 1);
      }
      resolve(found);
    });
  }
};

export default User;
