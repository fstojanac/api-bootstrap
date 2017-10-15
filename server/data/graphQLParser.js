/* eslint-disable no-param-reassign */
import castArr from 'lodash/values';

function fieldTreeFromAST(asts, fragments, init) {
  init = init || {};
  fragments = fragments || {};
  asts = castArr(asts);
  return asts.reduce((tree, val) => {
    const kind = val.kind;
    const name = val.name && val.name.value;
    let fragment;
    if (kind === 'Field') {
      if (val.selectionSet) {
        tree[name] = tree[name] || {};
        fieldTreeFromAST(val.selectionSet.selections, fragments, tree[name]);
      } else {
        tree[name] = true;
      }
    } else if (kind === 'FragmentSpread') {
      fragment = fragments[name];
      fieldTreeFromAST(fragment.selectionSet.selections, fragments, tree);
    } else if (kind === 'InlineFragment') {
      fragment = val;
      fieldTreeFromAST(fragment.selectionSet.selections, fragments, tree);
    }

    return tree;
  }, init);
}

function firstKey(obj = {}) {
  return Object.keys(obj)[0];
}

function parseFields(info, keepRoot) {
  let tree;

  if (info.fieldNodes) {
    tree = fieldTreeFromAST(info.fieldNodes, info.fragments);
    if (!keepRoot) {
      tree = tree[firstKey(tree)];
    }
  }
  // } else {
  //   // tree = fieldTreeFromAST.apply(this, arguments);
  //   tree = fieldTreeFromAST.apply(this, arguments);
  // }

  return tree;
}

export default parseFields;
